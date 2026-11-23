using AgroCita.Application.Common.Exceptions;
using AgroCita.Application.Common.Interfaces;
using AgroCita.Application.Common.Models;
using AgroCita.Domain.Entities;

namespace AgroCita.Application.Features.Indicadores;

public record ResumenIndicadoresDto(
    int Solicitudes,
    int SolicitudesAtendidas,
    int SolicitudesConVisita,
    int SolicitudesATiempo,
    double? PorcentajeATiempo,
    double? HorasPromedioRespuesta,
    double? DiasPromedioAtencion,
    int Visitas,
    int VisitasCompletadas,
    int VisitasCanceladas,
    int VisitasConFirma,
    int Recetas,
    int RecetasAplicadas,
    int RecetasNoAplicadas,
    int RecetasPendientes,
    int RecetasVencidas,
    double? PorcentajeCumplimientoRecetas);

public record IndicadorTecnicoDto(
    ReferenciaDto Tecnico,
    int Visitas,
    int Completadas,
    int Canceladas,
    int Recetas,
    int RecetasAplicadas,
    double? HorasPromedioRespuesta);

public record IndicadorZonaDto(string Departamento, string Municipio, int Solicitudes, int Visitas, int Pendientes);

public record IndicadorCultivoDto(string TipoCultivo, int Solicitudes, int Recetas);

public record IndicadorMesDto(string Mes, int Solicitudes, int Atendidas, int VisitasCompletadas);

public record IndicadoresDto(
    DateOnly Desde,
    DateOnly Hasta,
    ResumenIndicadoresDto Resumen,
    IReadOnlyList<IndicadorTecnicoDto> PorTecnico,
    IReadOnlyList<IndicadorZonaDto> PorZona,
    IReadOnlyList<IndicadorCultivoDto> PorCultivo,
    IReadOnlyList<IndicadorMesDto> PorMes);

public class IndicadoresHandler(
    IRepository<AssistanceRequest> solicitudes,
    IRepository<Visit> visitas,
    IRepository<Prescription> recetas,
    IExcelExporter excel)
{
    public async Task<IndicadoresDto> ObtenerAsync(DateOnly? desde, DateOnly? hasta, CancellationToken ct)
    {
        var fin = hasta ?? Fechas.Hoy;
        var inicio = desde ?? fin.AddDays(-89);

        if (inicio > fin)
        {
            throw Errores.Campo("desde", "La fecha inicial no puede ser posterior a la final.");
        }

        if (fin.DayNumber - inicio.DayNumber > 731)
        {
            throw Errores.Campo("desde", "El periodo no puede superar los dos años.");
        }

        var inicioUtc = inicio.InicioUtc();
        var finUtc = fin.AddDays(1).InicioUtc();
        var hoy = Fechas.Hoy;

        var listaSolicitudes = await solicitudes.ListAsync(
            s => s.FechaCreacion >= inicioUtc && s.FechaCreacion < finUtc,
            incluir: ["Finca", "Cultivos.Cultivo.TipoCultivo", "Visitas"],
            ct: ct);

        var listaVisitas = await visitas.ListAsync(
            v => (v.FechaProgramada >= inicioUtc && v.FechaProgramada < finUtc) ||
                 (v.FechaFirma >= inicioUtc && v.FechaFirma < finUtc),
            incluir: ["Tecnico.Usuario", "Solicitud.Finca", "Recetas"],
            ct: ct);

        var listaRecetas = await recetas.ListAsync(
            r => r.FechaCreacion >= inicioUtc && r.FechaCreacion < finUtc,
            incluir: ["Cultivo.TipoCultivo", "Visita"],
            ct: ct);

        var respuestas = listaSolicitudes
            .Select(s => (Solicitud: s, Primera: s.Visitas.OrderBy(v => v.FechaCreacion).FirstOrDefault()))
            .ToList();

        var conVisita = respuestas.Where(r => r.Primera is not null).ToList();

        var aTiempo = respuestas.Count(r =>
            r.Solicitud.Visitas
                .Where(v => v.Estado != VisitStatus.Cancelada)
                .OrderBy(v => v.FechaProgramada)
                .Select(v => (DateOnly?)ALocal(v.FechaProgramada))
                .FirstOrDefault() is DateOnly fecha &&
            fecha <= r.Solicitud.FechaDeseada);

        var atendidas = listaSolicitudes.Count(EstaAtendida);

        var diasAtencion = listaSolicitudes
            .Select(s => s.Visitas
                .Where(v => v.Estado == VisitStatus.Completada)
                .OrderBy(v => v.FechaProgramada)
                .Select(v => (double?)(v.FechaProgramada - s.FechaCreacion).TotalDays)
                .FirstOrDefault())
            .Where(d => d is not null)
            .Select(d => Math.Max(0, d!.Value))
            .ToList();

        var aplicadas = listaRecetas.Count(r => r.Estado == PrescriptionStatus.Aplicada);
        var noAplicadas = listaRecetas.Count(r => r.Estado == PrescriptionStatus.NoAplicada);
        var conSeguimiento = aplicadas + noAplicadas;

        var resumen = new ResumenIndicadoresDto(
            listaSolicitudes.Count,
            atendidas,
            conVisita.Count,
            aTiempo,
            Porcentaje(aTiempo, conVisita.Count),
            Promedio(conVisita.Select(r => (r.Primera!.FechaCreacion - r.Solicitud.FechaCreacion).TotalHours)),
            Promedio(diasAtencion),
            listaVisitas.Count,
            listaVisitas.Count(v => v.Estado == VisitStatus.Completada),
            listaVisitas.Count(v => v.Estado == VisitStatus.Cancelada),
            listaVisitas.Count(v => v.TieneFirma),
            listaRecetas.Count,
            aplicadas,
            noAplicadas,
            listaRecetas.Count(r => r.Estado == PrescriptionStatus.Pendiente),
            listaRecetas.Count(r => r.EstaVencida(hoy)),
            Porcentaje(aplicadas, conSeguimiento));

        var respuestaPorTecnico = conVisita
            .GroupBy(r => r.Primera!.TecnicoId)
            .ToDictionary(
                g => g.Key,
                g => Promedio(g.Select(r => (r.Primera!.FechaCreacion - r.Solicitud.FechaCreacion).TotalHours)));

        var porTecnico = listaVisitas
            .GroupBy(v => v.TecnicoId)
            .Select(g =>
            {
                var tecnico = g.First().Tecnico;
                var recetasTecnico = g.SelectMany(v => v.Recetas).ToList();

                return new IndicadorTecnicoDto(
                    new ReferenciaDto(g.Key, tecnico?.Usuario?.NombreCompleto ?? $"Técnico {g.Key}"),
                    g.Count(),
                    g.Count(v => v.Estado == VisitStatus.Completada),
                    g.Count(v => v.Estado == VisitStatus.Cancelada),
                    recetasTecnico.Count,
                    recetasTecnico.Count(r => r.Estado == PrescriptionStatus.Aplicada),
                    respuestaPorTecnico.GetValueOrDefault(g.Key));
            })
            .OrderByDescending(t => t.Visitas)
            .ToList();

        var visitasPorZona = listaVisitas
            .Where(v => v.Solicitud?.Finca is not null)
            .GroupBy(v => (v.Solicitud!.Finca!.Departamento, v.Solicitud.Finca.Municipio))
            .ToDictionary(g => g.Key, g => g.Count());

        var porZona = listaSolicitudes
            .Where(s => s.Finca is not null)
            .GroupBy(s => (s.Finca!.Departamento, s.Finca.Municipio))
            .Select(g => new IndicadorZonaDto(
                g.Key.Departamento,
                g.Key.Municipio,
                g.Count(),
                visitasPorZona.GetValueOrDefault(g.Key),
                g.Count(s => s.Estado == AssistanceRequestStatus.Pendiente)))
            .OrderByDescending(z => z.Solicitudes)
            .ThenBy(z => z.Departamento)
            .ToList();

        var recetasPorTipo = listaRecetas
            .GroupBy(r => r.Cultivo?.TipoCultivo?.Nombre ?? "Sin tipo")
            .ToDictionary(g => g.Key, g => g.Count());

        var porCultivo = listaSolicitudes
            .SelectMany(s => s.Cultivos
                .Select(c => c.Cultivo?.TipoCultivo?.Nombre ?? "Sin tipo")
                .Distinct()
                .Select(tipo => (Tipo: tipo, Solicitud: s.Id)))
            .GroupBy(x => x.Tipo)
            .Select(g => new IndicadorCultivoDto(g.Key, g.Count(), recetasPorTipo.GetValueOrDefault(g.Key)))
            .OrderByDescending(c => c.Solicitudes)
            .ToList();

        var porMes = new List<IndicadorMesDto>();

        for (var mes = new DateOnly(inicio.Year, inicio.Month, 1); mes <= fin; mes = mes.AddMonths(1))
        {
            var siguiente = mes.AddMonths(1);
            var delMes = listaSolicitudes.Where(s => EnMes(s.FechaCreacion, mes, siguiente)).ToList();

            porMes.Add(new IndicadorMesDto(
                $"{mes:yyyy-MM}",
                delMes.Count,
                delMes.Count(EstaAtendida),
                listaVisitas.Count(v => v.Estado == VisitStatus.Completada && EnMes(v.FechaProgramada, mes, siguiente))));
        }

        return new IndicadoresDto(inicio, fin, resumen, porTecnico, porZona, porCultivo, porMes);
    }

    public async Task<byte[]> ExcelAsync(DateOnly? desde, DateOnly? hasta, CancellationToken ct)
    {
        var datos = await ObtenerAsync(desde, hasta, ct);
        var r = datos.Resumen;

        var resumen = new HojaExcel(
            "Resumen",
            ["Indicador", "Valor"],
            [
                ["Periodo", $"{datos.Desde:yyyy-MM-dd} a {datos.Hasta:yyyy-MM-dd}"],
                ["Solicitudes recibidas", r.Solicitudes],
                ["Solicitudes atendidas", r.SolicitudesAtendidas],
                ["Solicitudes con visita", r.SolicitudesConVisita],
                ["Atendidas a tiempo", r.SolicitudesATiempo],
                ["% atendidas a tiempo", r.PorcentajeATiempo],
                ["Horas promedio hasta programar", Redondear(r.HorasPromedioRespuesta)],
                ["Días promedio hasta atender", Redondear(r.DiasPromedioAtencion)],
                ["Visitas programadas", r.Visitas],
                ["Visitas completadas", r.VisitasCompletadas],
                ["Visitas canceladas", r.VisitasCanceladas],
                ["Visitas con firma del productor", r.VisitasConFirma],
                ["Recetas emitidas", r.Recetas],
                ["Recetas aplicadas", r.RecetasAplicadas],
                ["Recetas no aplicadas", r.RecetasNoAplicadas],
                ["Recetas pendientes", r.RecetasPendientes],
                ["Recetas vencidas", r.RecetasVencidas],
                ["% cumplimiento de recetas", r.PorcentajeCumplimientoRecetas]
            ]);

        var tecnicos = new HojaExcel(
            "Por técnico",
            ["Técnico", "Visitas", "Completadas", "Canceladas", "Recetas", "Recetas aplicadas", "Horas promedio de respuesta"],
            datos.PorTecnico
                .Select(t => new object?[]
                {
                    t.Tecnico.Nombre, t.Visitas, t.Completadas, t.Canceladas, t.Recetas, t.RecetasAplicadas,
                    Redondear(t.HorasPromedioRespuesta)
                })
                .ToList());

        var zonas = new HojaExcel(
            "Por zona",
            ["Departamento", "Municipio", "Solicitudes", "Visitas", "Pendientes"],
            datos.PorZona
                .Select(z => new object?[] { z.Departamento, z.Municipio, z.Solicitudes, z.Visitas, z.Pendientes })
                .ToList());

        var cultivos = new HojaExcel(
            "Por cultivo",
            ["Tipo de cultivo", "Solicitudes", "Recetas"],
            datos.PorCultivo.Select(c => new object?[] { c.TipoCultivo, c.Solicitudes, c.Recetas }).ToList());

        var meses = new HojaExcel(
            "Por mes",
            ["Mes", "Solicitudes", "Atendidas", "Visitas completadas"],
            datos.PorMes.Select(m => new object?[] { m.Mes, m.Solicitudes, m.Atendidas, m.VisitasCompletadas }).ToList());

        return excel.Generar([resumen, tecnicos, zonas, cultivos, meses]);
    }

    private static bool EstaAtendida(AssistanceRequest solicitud) =>
        solicitud.Estado == AssistanceRequestStatus.Atendida ||
        solicitud.Visitas.Any(v => v.Estado == VisitStatus.Completada);

    private static bool EnMes(DateTime fecha, DateOnly mes, DateOnly siguiente)
    {
        var local = ALocal(fecha);
        return local >= mes && local < siguiente;
    }

    private static DateOnly ALocal(DateTime fechaUtc) =>
        DateOnly.FromDateTime(fechaUtc.AddHours(-6));

    private static double? Porcentaje(int parte, int total) =>
        total == 0 ? null : Math.Round(parte * 100.0 / total, 1);

    private static double? Promedio(IEnumerable<double> valores)
    {
        var lista = valores.ToList();
        return lista.Count == 0 ? null : Math.Round(lista.Average(), 1);
    }

    private static double? Redondear(double? valor) => valor is null ? null : Math.Round(valor.Value, 1);
}
