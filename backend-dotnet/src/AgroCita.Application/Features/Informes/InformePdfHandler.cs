using AgroCita.Application.Common.Exceptions;
using AgroCita.Application.Common.Interfaces;
using AgroCita.Application.Common.Models;
using AgroCita.Application.Common.Services;
using AgroCita.Domain.Entities;

namespace AgroCita.Application.Features.Informes;

public record EmpresaPdf(string Nombre, string Rtn, string Telefono, string Email, string? Direccion, byte[]? Logo);

public record InspeccionPdf(string Cultivo, string? Categoria, string? Observaciones, IReadOnlyList<(string Parametro, string Valor)> Resultados);

public record RecetaPdf(
    string Cultivo,
    string Producto,
    string Tipo,
    decimal Dosis,
    string Unidad,
    string? Metodo,
    DateOnly FechaAplicacion,
    string? Indicaciones,
    string Estado);

public record FotoPdf(byte[] Imagen, string? Descripcion, string? Cultivo, DateTime Fecha, double? Latitud, double? Longitud);

public record FirmaPdf(byte[] Imagen, string FirmadoPor, DateTime Fecha, double? Latitud, double? Longitud);

public record InformePdfModelo(
    EmpresaPdf Empresa,
    int VisitaId,
    string Finca,
    string Ubicacion,
    string Productor,
    string Tecnico,
    DateTime FechaVisita,
    string Estado,
    string Motivo,
    IReadOnlyList<string> Cultivos,
    string Observaciones,
    string Diagnostico,
    string Recomendaciones,
    DateTime FechaInforme,
    IReadOnlyList<InspeccionPdf> Inspecciones,
    IReadOnlyList<RecetaPdf> Recetas,
    IReadOnlyList<FotoPdf> Fotos,
    int FotosOmitidas,
    FirmaPdf? Firma,
    DateOnly? FechaSeguimiento,
    DateTime Generado);

public interface IInformePdfGenerator
{
    byte[] Generar(InformePdfModelo modelo);
}

public class InformePdfHandler(
    ActorActual actor,
    IRepository<Company> empresas,
    IRepository<Inspection> inspecciones,
    IRepository<Prescription> recetas,
    IRepository<VisitEvidence> evidencias,
    IFileStorage almacenamiento,
    IInformePdfGenerator generador)
{
    private const int MaximoFotos = 12;

    public async Task<(byte[] Contenido, string Nombre)> GenerarAsync(int visitaId, CancellationToken ct)
    {
        var visita = await actor.VisitaAsync(
            visitaId,
            false,
            ct,
            "Solicitud.Finca.Productor.Usuario",
            "Solicitud.Cultivos.Cultivo",
            "Tecnico.Usuario",
            "Informe");

        var informe = visita.Informe
            ?? throw new ConflictException("La visita todavía no tiene informe.");

        var empresa = await empresas.FirstAsync(e => true, ct: ct)
            ?? throw new NotFoundException("La organización no existe.");

        var listaInspecciones = await inspecciones.ListAsync(
            i => i.VisitaId == visitaId,
            q => q.OrderBy(i => i.Id),
            incluir: ["Cultivo", "CategoriaCalidad", "Resultados.ParametroEvaluacion"],
            ct: ct);

        var listaRecetas = await recetas.ListAsync(
            r => r.VisitaId == visitaId,
            q => q.OrderBy(r => r.FechaAplicacion).ThenBy(r => r.Id),
            incluir: ["Cultivo"],
            ct: ct);

        var listaEvidencias = await evidencias.ListAsync(
            e => e.VisitaId == visitaId,
            q => q.OrderBy(e => e.FechaCaptura),
            incluir: ["Cultivo"],
            ct: ct);

        var fotos = new List<FotoPdf>();

        foreach (var evidencia in listaEvidencias.Take(MaximoFotos))
        {
            var bytes = await LeerAsync(evidencia.Archivo, ct);

            if (bytes is not null)
            {
                fotos.Add(new FotoPdf(
                    bytes,
                    evidencia.Descripcion,
                    evidencia.Cultivo?.Nombre,
                    evidencia.FechaCaptura,
                    evidencia.Latitud,
                    evidencia.Longitud));
            }
        }

        var firmaBytes = visita.FirmaArchivo is null ? null : await LeerAsync(visita.FirmaArchivo, ct);
        var logo = empresa.LogoArchivo is null ? null : await LeerAsync(empresa.LogoArchivo, ct);
        var finca = visita.Solicitud!.Finca!;
        var hoy = Fechas.Hoy;

        var modelo = new InformePdfModelo(
            new EmpresaPdf(empresa.Nombre, empresa.Rtn, empresa.Telefono, empresa.Email, empresa.Direccion, logo),
            visita.Id,
            finca.Nombre,
            $"{finca.Ubicacion}, {finca.Municipio}, {finca.Departamento}",
            finca.Productor?.Usuario?.NombreCompleto ?? string.Empty,
            visita.Tecnico?.Usuario?.NombreCompleto ?? string.Empty,
            visita.FechaProgramada,
            visita.Estado.ToString(),
            visita.Solicitud.Motivo,
            visita.Solicitud.Cultivos.Where(c => c.Cultivo is not null).Select(c => c.Cultivo!.Nombre).ToList(),
            informe.Observaciones,
            informe.Diagnostico,
            informe.Recomendaciones,
            informe.FechaElaboracion,
            listaInspecciones
                .Select(i => new InspeccionPdf(
                    i.Cultivo?.Nombre ?? string.Empty,
                    i.CategoriaCalidad?.Nombre,
                    i.Observaciones,
                    i.Resultados
                        .Select(r => (
                            r.ParametroEvaluacion?.Nombre ?? string.Empty,
                            r.ParametroEvaluacion?.Unidad is { } unidad ? $"{r.Valor} {unidad}" : r.Valor))
                        .ToList()))
                .ToList(),
            listaRecetas
                .Select(r => new RecetaPdf(
                    r.Cultivo?.Nombre ?? string.Empty,
                    r.Producto,
                    r.TipoProducto.ToString(),
                    r.Dosis,
                    r.Unidad,
                    r.MetodoAplicacion,
                    r.FechaAplicacion,
                    r.Indicaciones,
                    r.EstaVencida(hoy) ? "Vencida" : r.Estado switch
                    {
                        PrescriptionStatus.Aplicada => "Aplicada",
                        PrescriptionStatus.NoAplicada => "No aplicada",
                        _ => "Pendiente"
                    }))
                .ToList(),
            fotos,
            Math.Max(0, listaEvidencias.Count - fotos.Count),
            firmaBytes is null
                ? null
                : new FirmaPdf(firmaBytes, visita.FirmadoPor ?? string.Empty, visita.FechaFirma ?? visita.FechaProgramada, visita.FirmaLatitud, visita.FirmaLongitud),
            visita.FechaSeguimiento,
            Fechas.Ahora);

        return (generador.Generar(modelo), $"informe-visita-V{visita.Id:0000}.pdf");
    }

    private async Task<byte[]?> LeerAsync(string clave, CancellationToken ct)
    {
        await using var flujo = almacenamiento.Abrir(clave);

        if (flujo is null)
        {
            return null;
        }

        using var memoria = new MemoryStream();
        await flujo.CopyToAsync(memoria, ct);

        return memoria.ToArray();
    }
}
