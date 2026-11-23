using AgroCita.Application.Features.Recetas;
using AgroCita.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgroCita.API.Controllers.Visitas;

[ApiController]
[Route("api")]
public class RecetasController(RecetasHandler recetas) : ControllerBase
{
    [HttpPost("visitas/{visitaId:int}/recetas")]
    [Authorize(Roles = Permisos.Tecnico)]
    public async Task<ActionResult<RecetaDto>> Crear(
        int visitaId, [FromBody] CrearRecetaDto dto, CancellationToken ct)
    {
        var receta = await recetas.CrearAsync(visitaId, dto, ct);

        return Created($"/api/recetas/{receta.Id}", receta);
    }

    [HttpGet("visitas/{visitaId:int}/recetas")]
    [Authorize(Roles = Permisos.Empresa)]
    public async Task<ActionResult<IReadOnlyList<RecetaDto>>> ListarPorVisita(int visitaId, CancellationToken ct) =>
        Ok(await recetas.ListarPorVisitaAsync(visitaId, ct));

    [HttpGet("recetas")]
    [Authorize(Roles = Permisos.Empresa)]
    public async Task<ActionResult<IReadOnlyList<RecetaDto>>> Listar(
        [FromQuery] PrescriptionStatus? estado,
        [FromQuery] bool vencidas = false,
        CancellationToken ct = default) =>
        Ok(await recetas.ListarAsync(estado, vencidas, ct));

    [HttpPatch("recetas/{id:int}/seguimiento")]
    [Authorize(Roles = Permisos.Empresa)]
    public async Task<ActionResult<RecetaDto>> Seguimiento(
        int id, [FromBody] SeguimientoRecetaDto dto, CancellationToken ct) =>
        Ok(await recetas.SeguimientoAsync(id, dto, ct));

    [HttpDelete("recetas/{id:int}")]
    [Authorize(Roles = Permisos.Tecnico)]
    public async Task<IActionResult> Eliminar(int id, CancellationToken ct)
    {
        await recetas.EliminarAsync(id, ct);

        return NoContent();
    }
}
