using AgroCita.Application.Features.Evidencias;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgroCita.API.Controllers.Visitas;

public class SubirEvidenciaForm
{
    public IFormFile? Archivo { get; set; }
    public int? CultivoId { get; set; }
    public string? Descripcion { get; set; }
    public double? Latitud { get; set; }
    public double? Longitud { get; set; }
    public double? PrecisionMetros { get; set; }
    public DateTime? FechaCaptura { get; set; }
}

[ApiController]
[Route("api")]
public class EvidenciasController(EvidenciasHandler evidencias) : ControllerBase
{
    [HttpPost("visitas/{visitaId:int}/evidencias")]
    [Authorize(Roles = Permisos.Tecnico)]
    [RequestSizeLimit(LimitesEvidencia.TamanoMaximo + 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = LimitesEvidencia.TamanoMaximo + 1024 * 1024)]
    public async Task<ActionResult<EvidenciaDto>> Subir(
        int visitaId, [FromForm] SubirEvidenciaForm form, CancellationToken ct)
    {
        await using var contenido = form.Archivo?.OpenReadStream();

        var evidencia = await evidencias.SubirAsync(
            visitaId,
            new SubirEvidenciaDto(
                contenido,
                form.Archivo?.ContentType,
                form.Archivo?.Length ?? 0,
                form.CultivoId,
                form.Descripcion,
                form.Latitud,
                form.Longitud,
                form.PrecisionMetros,
                form.FechaCaptura),
            ct);

        return Created($"/api/evidencias/{evidencia.Id}/archivo", evidencia);
    }

    [HttpGet("visitas/{visitaId:int}/evidencias")]
    [Authorize(Roles = Permisos.Empresa)]
    public async Task<ActionResult<IReadOnlyList<EvidenciaDto>>> Listar(int visitaId, CancellationToken ct) =>
        Ok(await evidencias.ListarAsync(visitaId, ct));

    [HttpGet("evidencias/{id:int}/archivo")]
    [Authorize(Roles = Permisos.Empresa)]
    public async Task<IActionResult> Archivo(int id, CancellationToken ct)
    {
        var archivo = await evidencias.ArchivoAsync(id, ct);

        Response.Headers.CacheControl = "private, max-age=3600";

        return File(archivo.Contenido, archivo.ContentType, archivo.NombreDescarga);
    }

    [HttpDelete("evidencias/{id:int}")]
    [Authorize(Roles = Permisos.Tecnico)]
    public async Task<IActionResult> Eliminar(int id, CancellationToken ct)
    {
        await evidencias.EliminarAsync(id, ct);

        return NoContent();
    }
}
