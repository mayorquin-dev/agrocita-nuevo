using System.Globalization;
using AgroCita.Application.Common.Exceptions;
using AgroCita.Application.Common.Interfaces;
using AgroCita.Application.Common.Models;
using AgroCita.Application.Common.Services;
using AgroCita.Application.Features.Fincas;
using AgroCita.Application.Features.Productores;
using AgroCita.Domain.Entities;

namespace AgroCita.Application.Features.Trazabilidad;

public record LoteDto(
    int Id,
    string Nombre,
    string TipoCultivo,
    string? Variedad,
    decimal? AreaManzanas,
    DateOnly? FechaSiembra,
    bool Activo,
    ReferenciaDto Finca,
    string Departamento,
    string Municipio,
    string Direccion,
    ReferenciaDto Productor,
    string DniProductor);

public record EventoTrazaDto(
    DateTime Fecha,
    string Tipo,
    string Titulo,
    string Detalle,
    string? Responsable,
    string? Estado,
    int? VisitaId);

public record ProductoAplicadoDto(
    string Producto,
    string Tipo,
    decimal Dosis,
    string Unidad,
    DateOnly FechaIndicada,
    DateOnly? FechaAplicada,
    string Estado,
    string Origen,
    string? Responsable);

public record CumplimientoDto(
    int VisitasCompletadas,
    int VisitasConFirma,
    int VisitasConInforme,
    int Evidencias,
    int EvidenciasConUbicacion,
    int Recetas,
    int RecetasConSeguimiento,
    int RecetasAplicadas,
    int RecetasVencidas,
    int Inspecciones,
    int Puntaje,
    IReadOnlyList<string> Alertas);

public record TrazabilidadDto(
    LoteDto Lote,
    DateOnly? Desde,
    DateOnly? Hasta,
    DateTime Generado,
    CumplimientoDto Cumplimiento,
    IReadOnlyList<ProductoAplicadoDto> Productos,
    IReadOnlyList<EventoTrazaDto> Eventos);

public class TrazabilidadHandler(
    ActorActual actor,
    IRepository<Crop> cultivos,
    IRepository<Visit> visitas,
    IRepository<Inspection> inspecciones,
    IRepository<Prescription> recetas,
    IRepository<FertilizationRecommendation> recomendaciones,
    IRepository<FertilizerApplication> aplicaciones,
    IRepository<VisitEvidence> evidencias,
    IExcelExporter excel)
{
    private static readonly CultureInfo Cultura = CultureInfo.GetCultureInfo("es-HN");

    public async Task<TrazabilidadDto> ObtenerAsync(
        int cultivoId, DateOnly? desde, DateOnly? hasta, CancellationToken ct)
    {
        if (desde is not null && hasta is not null && desde > hasta)
        {
            throw Errores.Campo("desde", "La fecha inicial no puede ser posterior a la final.");
        }

        await actor.CultivoAsync(cultivoId, ct);

        var cultivo = await cultivos.FirstAsync(
                c => c.Id == cultivoId, ["TipoCultivo", "Finca.Productor.Usuario"], ct: ct)
            ?? throw new NotFoundException("El cultivo no existe.");

        DateTime? inicio = desde?.InicioUtc();
        DateTime? fin = hasta?.AddDays(1).InicioUtc();
        var hoy = Fechas.Hoy;

        bool EnRango(DateTime fecha) => (inicio == null || fecha >= inicio) && (fin == null || fecha < fin);

        var listaVisitas = (await visitas.ListAsync(
                v => v.Solicitud!.Cultivos.Any(c => c.CultivoId == cultivoId),
                q => q.OrderBy(v => v.FechaProgramada),
                incluir: ["Solicitud", "Tecnico.Usuario", "Informe"],
                ct: ct))
            .Where(v => EnRango(v.FechaProgramada))
            .ToList();

        var listaInspecciones = (await inspecciones.ListAsync(
                i => i.CultivoId == cultivoId,
                incluir: ["CategoriaCalidad", "Resultados.ParametroEvaluacion", "Visita.Tecnico.Usuario"],
                ct: ct))
            .Where(i => EnRango(i.FechaInspeccion))
            .ToList();

        var listaRecetas = (await recetas.ListAsync(
                r => r.CultivoId == cultivoId,
                incluir: ["Visita.Tecnico.Usuario", "UsuarioSeguimiento", "Entregas.Insumo", "Entregas.Usuario"],
                ct: ct))
            .Where(r => EnRango(r.FechaCreacion))
            .ToList();

        var listaRecomendaciones = (await recomendaciones.ListAsync(
                r => r.CultivoId == cultivoId,
                incluir: ["Fertilizante", "Visita.Tecnico.Usuario"],
                ct: ct))
            .Where(r => EnRango(r.FechaRecomendacion.InicioUtc()))
            .ToList();

        var listaAplicaciones = (await aplicaciones.ListAsync(
                a => a.CultivoId == cultivoId,
                incluir: ["Fertilizante", "Tecnico.Usuario"],
                ct: ct))
            .Where(a => EnRango(a.FechaAplicacion.InicioUtc()))
            .ToList();

        var idsVisitas = listaVisitas.Select(v => v.Id).ToList();

        var listaEvidencias = (await evidencias.ListAsync(
                e => idsVisitas.Contains(e.VisitaId) && (e.CultivoId == null || e.CultivoId == cultivoId),
                incluir: ["Usuario"],
                ct: ct))
            .ToList();

        var eventos = new List<EventoTrazaDto>();

        var solicitudesVistas = new HashSet<int>();

        foreach (var visita in listaVisitas)
        {
            var tecnico = visita.Tecnico?.Usuario?.NombreCompleto;

            if (solicitudesVistas.Add(visita.SolicitudId))
            {
                eventos.Add(new EventoTrazaDto(
                    visita.Solicitud!.FechaCreacion,
                    "Solicitud",
                    $"Solicitud de asistencia S-{visita.SolicitudId:0000}",
                    visita.Solicitud.Motivo,
                    cultivo.Finca?.Productor?.Usuario?.NombreCompleto,
                    visita.Solicitud.Estado.ToString(),
                    null));
            }

            eventos.Add(new EventoTrazaDto(
                visita.FechaProgramada,
                "Visita",
                $"Visita técnica V-{visita.Id:0000}",
                visita.Estado == VisitStatus.Cancelada
                    ? $"Cancelada: {visita.MotivoCancelacion}"
                    : $"Estado: {visita.Estado}",
                tecnico,
                visita.Estado.ToString(),
                visita.Id));

            if (visita.Informe is not null)
            {
                eventos.Add(new EventoTrazaDto(
                    visita.Informe.FechaElaboracion,
                    "Informe",
                    "Informe técnico",
                    $"Diagnóstico: {visita.Informe.Diagnostico}",
                    tecnico,
                    null,
                    visita.Id));
            }

            if (visita.TieneFirma)
            {
                eventos.Add(new EventoTrazaDto(
                    visita.FechaFirma ?? visita.FechaProgramada,
                    "Firma",
                    "Cierre firmado por el productor",
                    visita.FirmaLatitud is null
                        ? $"Firmó {visita.FirmadoPor}"
                        : $"Firmó {visita.FirmadoPor} · GPS {Coordenadas(visita.FirmaLatitud, visita.FirmaLongitud)}",
                    visita.FirmadoPor,
                    null,
                    visita.Id));
            }
        }

        eventos.AddRange(listaInspecciones.Select(i => new EventoTrazaDto(
            i.FechaInspeccion,
            "Inspeccion",
            i.CategoriaCalidad is null ? "Inspección de calidad" : $"Inspección · {i.CategoriaCalidad.Nombre}",
            string.Join("; ", i.Resultados.Select(r =>
                $"{r.ParametroEvaluacion?.Nombre}: {r.Valor}{(r.ParametroEvaluacion?.Unidad is { } u ? " " + u : "")}")) is { Length: > 0 } detalle
                ? detalle
                : i.Observaciones ?? "Sin parámetros registrados",
            i.Visita?.Tecnico?.Usuario?.NombreCompleto,
            null,
            i.VisitaId)));

        foreach (var receta in listaRecetas)
        {
            eventos.Add(new EventoTrazaDto(
                receta.FechaCreacion,
                "Receta",
                $"Receta · {receta.Producto}",
                $"{receta.TipoProducto}: {Numero(receta.Dosis)} {receta.Unidad}" +
                $"{(receta.MetodoAplicacion is null ? "" : $" ({receta.MetodoAplicacion})")}" +
                $" para el {receta.FechaAplicacion:dd/MM/yyyy}",
                receta.Visita?.Tecnico?.Usuario?.NombreCompleto,
                receta.Estado.ToString(),
                receta.VisitaId));

            foreach (var entrega in receta.Entregas.Where(e => e.Tipo == MovementType.Entrega))
            {
                eventos.Add(new EventoTrazaDto(
                    entrega.Fecha.InicioUtc().AddHours(18),
                    "Entrega",
                    $"Insumo entregado · {entrega.Insumo?.Nombre ?? receta.Producto}",
                    $"{Numero(entrega.Cantidad)} {entrega.Insumo?.Unidad}{(entrega.Nota is null ? "" : $". {entrega.Nota}")}",
                    entrega.Usuario?.NombreCompleto,
                    null,
                    receta.VisitaId));
            }

            if (receta.FechaRegistroSeguimiento is DateTime registrado)
            {
                eventos.Add(new EventoTrazaDto(
                    registrado,
                    "Seguimiento",
                    receta.Estado == PrescriptionStatus.Aplicada
                        ? $"Aplicado · {receta.Producto}"
                        : $"No aplicado · {receta.Producto}",
                    receta.Estado == PrescriptionStatus.Aplicada
                        ? $"Aplicado el {receta.FechaAplicacionReal:dd/MM/yyyy}{(receta.ComentarioSeguimiento is null ? "" : $". {receta.ComentarioSeguimiento}")}"
                        : receta.ComentarioSeguimiento ?? string.Empty,
                    receta.UsuarioSeguimiento?.NombreCompleto,
                    receta.Estado.ToString(),
                    receta.VisitaId));
            }
        }

        eventos.AddRange(listaRecomendaciones.Select(r => new EventoTrazaDto(
            r.FechaRecomendacion.InicioUtc(),
            "Fertilizacion",
            $"Recomendación de fertilización · {r.Fertilizante?.Nombre}",
            $"{Numero(r.DosisRecomendada)} {r.Fertilizante?.UnidadMedida} {r.Frecuencia}. {r.Indicaciones}".Trim(),
            r.Visita?.Tecnico?.Usuario?.NombreCompleto,
            null,
            r.VisitaId)));

        eventos.AddRange(listaAplicaciones.Select(a => new EventoTrazaDto(
            a.FechaAplicacion.InicioUtc(),
            "Aplicacion",
            $"Aplicación de fertilizante · {a.Fertilizante?.Nombre}",
            $"{Numero(a.CantidadAplicada)} {a.Fertilizante?.UnidadMedida}{(a.Observaciones is null ? "" : $". {a.Observaciones}")}",
            a.Tecnico?.Usuario?.NombreCompleto,
            null,
            null)));

        eventos.AddRange(listaEvidencias.Select(e => new EventoTrazaDto(
            e.FechaCaptura,
            "Evidencia",
            "Evidencia fotográfica",
            (e.Descripcion ?? "Foto de campo") +
            (e.TieneUbicacion ? $" · GPS {Coordenadas(e.Latitud, e.Longitud)}" : " · sin ubicación"),
            e.Usuario?.NombreCompleto,
            null,
            e.VisitaId)));

        var productos = listaRecetas
            .Select(r => new ProductoAplicadoDto(
                r.Producto,
                r.TipoProducto.ToString(),
                r.Dosis,
                r.Unidad,
                r.FechaAplicacion,
                r.FechaAplicacionReal,
                r.EstaVencida(hoy) ? "Vencida" : r.Estado.ToString(),
                "Receta",
                r.Visita?.Tecnico?.Usuario?.NombreCompleto))
            .Concat(listaAplicaciones.Select(a => new ProductoAplicadoDto(
                a.Fertilizante?.Nombre ?? "Fertilizante",
                "Fertilizante",
                a.CantidadAplicada,
                a.Fertilizante?.UnidadMedida ?? string.Empty,
                a.FechaAplicacion,
                a.FechaAplicacion,
                "Aplicada",
                "Aplicación registrada",
                a.Tecnico?.Usuario?.NombreCompleto)))
            .OrderBy(p => p.FechaAplicada ?? p.FechaIndicada)
            .ToList();

        var completadas = listaVisitas.Where(v => v.Estado == VisitStatus.Completada).ToList();
        var conSeguimiento = listaRecetas.Count(r => r.Estado != PrescriptionStatus.Pendiente);
        var vencidas = listaRecetas.Count(r => r.EstaVencida(hoy));
        var sinFirma = completadas.Count(v => !v.TieneFirma);
        var sinInforme = completadas.Count(v => v.Informe is null);
        var sinGps = listaEvidencias.Count(e => !e.TieneUbicacion);

        var alertas = new List<string>();

        if (completadas.Count == 0)
        {
            alertas.Add("No hay visitas completadas en el periodo.");
        }

        if (sinFirma > 0)
        {
            alertas.Add($"{sinFirma} visita(s) completada(s) sin firma del productor.");
        }

        if (sinInforme > 0)
        {
            alertas.Add($"{sinInforme} visita(s) completada(s) sin informe técnico.");
        }

        if (vencidas > 0)
        {
            alertas.Add($"{vencidas} receta(s) vencida(s) sin confirmar si se aplicaron.");
        }

        if (sinGps > 0)
        {
            alertas.Add($"{sinGps} evidencia(s) sin ubicación GPS.");
        }

        if (completadas.Count > 0 && listaEvidencias.Count == 0)
        {
            alertas.Add("No hay evidencias fotográficas del cultivo.");
        }

        var controles = new List<bool>();
        controles.AddRange(completadas.Select(v => v.TieneFirma));
        controles.AddRange(completadas.Select(v => v.Informe is not null));
        controles.AddRange(listaRecetas.Where(r => r.Estado != PrescriptionStatus.Pendiente || r.EstaVencida(hoy))
            .Select(r => r.Estado != PrescriptionStatus.Pendiente));
        controles.AddRange(listaEvidencias.Select(e => e.TieneUbicacion));

        var puntaje = controles.Count == 0 ? 0 : (int)Math.Round(controles.Count(c => c) * 100.0 / controles.Count);

        var cumplimiento = new CumplimientoDto(
            completadas.Count,
            completadas.Count(v => v.TieneFirma),
            completadas.Count(v => v.Informe is not null),
            listaEvidencias.Count,
            listaEvidencias.Count(e => e.TieneUbicacion),
            listaRecetas.Count,
            conSeguimiento,
            listaRecetas.Count(r => r.Estado == PrescriptionStatus.Aplicada),
            vencidas,
            listaInspecciones.Count,
            puntaje,
            alertas);

        var finca = cultivo.Finca!;

        var lote = new LoteDto(
            cultivo.Id,
            cultivo.Nombre,
            cultivo.TipoCultivo?.Nombre ?? string.Empty,
            cultivo.Variedad,
            cultivo.AreaSembrada,
            cultivo.FechaSiembra,
            cultivo.Activo,
            finca.AReferencia(),
            finca.Departamento,
            finca.Municipio,
            finca.Ubicacion,
            finca.Productor?.AReferencia() ?? new ReferenciaDto(0, string.Empty),
            finca.Productor?.Dni ?? string.Empty);

        return new TrazabilidadDto(
            lote,
            desde,
            hasta,
            Fechas.Ahora,
            cumplimiento,
            productos,
            eventos.OrderBy(e => e.Fecha).ToList());
    }

    public async Task<(byte[] Contenido, string Nombre)> ExcelAsync(
        int cultivoId, DateOnly? desde, DateOnly? hasta, CancellationToken ct)
    {
        var datos = await ObtenerAsync(cultivoId, desde, hasta, ct);
        var lote = datos.Lote;
        var c = datos.Cumplimiento;

        var ficha = new HojaExcel(
            "Lote",
            ["Campo", "Valor"],
            [
                ["Cultivo / lote", lote.Nombre],
                ["Tipo de cultivo", lote.TipoCultivo],
                ["Variedad", lote.Variedad],
                ["Área (mz)", lote.AreaManzanas],
                ["Fecha de siembra", lote.FechaSiembra],
                ["Finca", lote.Finca.Nombre],
                ["Ubicación", $"{lote.Direccion}, {lote.Municipio}, {lote.Departamento}"],
                ["Productor", lote.Productor.Nombre],
                ["DNI", lote.DniProductor],
                ["Periodo", Periodo(datos.Desde, datos.Hasta)],
                ["Generado (UTC)", datos.Generado],
                ["Puntaje de cumplimiento", $"{c.Puntaje}%"],
                ["Visitas completadas", c.VisitasCompletadas],
                ["Visitas con firma", c.VisitasConFirma],
                ["Visitas con informe", c.VisitasConInforme],
                ["Recetas emitidas", c.Recetas],
                ["Recetas con seguimiento", c.RecetasConSeguimiento],
                ["Recetas vencidas", c.RecetasVencidas],
                ["Evidencias", c.Evidencias],
                ["Evidencias con GPS", c.EvidenciasConUbicacion],
                ["Alertas", string.Join(" | ", c.Alertas)]
            ]);

        var bitacora = new HojaExcel(
            "Bitácora",
            ["Fecha (UTC)", "Tipo", "Evento", "Detalle", "Responsable", "Estado", "Visita"],
            datos.Eventos
                .Select(e => new object?[]
                {
                    e.Fecha, e.Tipo, e.Titulo, e.Detalle, e.Responsable, e.Estado,
                    e.VisitaId is null ? null : $"V-{e.VisitaId:0000}"
                })
                .ToList());

        var productos = new HojaExcel(
            "Productos",
            ["Producto", "Tipo", "Dosis", "Unidad", "Fecha indicada", "Fecha aplicada", "Estado", "Origen", "Responsable"],
            datos.Productos
                .Select(p => new object?[]
                {
                    p.Producto, p.Tipo, p.Dosis, p.Unidad, p.FechaIndicada, p.FechaAplicada, p.Estado, p.Origen, p.Responsable
                })
                .ToList());

        var nombre = $"trazabilidad-{Slug(lote.Finca.Nombre)}-{Slug(lote.Nombre)}.xlsx";

        return (excel.Generar([ficha, bitacora, productos]), nombre);
    }

    private static string Periodo(DateOnly? desde, DateOnly? hasta) =>
        (desde, hasta) switch
        {
            (null, null) => "Todo el historial",
            (not null, null) => $"Desde {desde:dd/MM/yyyy}",
            (null, not null) => $"Hasta {hasta:dd/MM/yyyy}",
            _ => $"{desde:dd/MM/yyyy} a {hasta:dd/MM/yyyy}"
        };

    private static string Numero(decimal valor) => valor.ToString("0.###", Cultura);

    private static string Coordenadas(double? latitud, double? longitud) =>
        string.Create(CultureInfo.InvariantCulture, $"{latitud:0.00000}, {longitud:0.00000}");

    private static string Slug(string texto)
    {
        var limpio = new string(texto
            .Normalize(System.Text.NormalizationForm.FormD)
            .Where(ch => CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
            .Select(ch => char.IsLetterOrDigit(ch) ? char.ToLowerInvariant(ch) : '-')
            .ToArray());

        return string.Join('-', limpio.Split('-', StringSplitOptions.RemoveEmptyEntries));
    }
}
