using AgroCita.Application.Common.Models;
using AgroCita.Application.Features.Auditoria;
using AgroCita.Application.Features.Inventario;
using AgroCita.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgroCita.API.Controllers.Inventario;

[ApiController]
[Route("api/insumos")]
public class InventarioController(InventarioHandler inventario) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = Permisos.AdminOTecnico)]
    public async Task<ActionResult<IReadOnlyList<InsumoDto>>> Listar(
        [FromQuery] bool soloActivos = false, CancellationToken ct = default) =>
        Ok(await inventario.ListarAsync(soloActivos, ct));

    [HttpPost]
    [Authorize(Roles = Permisos.Admin)]
    public async Task<ActionResult<InsumoDto>> Crear([FromBody] GuardarInsumoDto dto, CancellationToken ct)
    {
        var insumo = await inventario.CrearAsync(dto, ct);

        return Created($"/api/insumos/{insumo.Id}", insumo);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Permisos.Admin)]
    public async Task<ActionResult<InsumoDto>> Actualizar(int id, [FromBody] GuardarInsumoDto dto, CancellationToken ct) =>
        Ok(await inventario.ActualizarAsync(id, dto, ct));

    [HttpPost("{id:int}/movimientos")]
    [Authorize(Roles = Permisos.Admin)]
    public async Task<ActionResult<MovimientoDto>> RegistrarMovimiento(
        int id, [FromBody] MovimientoInsumoDto dto, CancellationToken ct) =>
        Ok(await inventario.RegistrarMovimientoAsync(id, dto, ct));

    [HttpGet("movimientos")]
    [Authorize(Roles = Permisos.AdminOProductor)]
    public async Task<ActionResult<PaginadoDto<MovimientoDto>>> Movimientos(
        [FromQuery] int? insumoId,
        [FromQuery] int? productorId,
        [FromQuery] MovementType? tipo,
        [FromQuery] int? pagina,
        [FromQuery] int? tamano,
        CancellationToken ct) =>
        Ok(await inventario.MovimientosAsync(insumoId, productorId, tipo, pagina, tamano, ct));
}

[ApiController]
[Route("api/auditoria")]
[Authorize(Roles = Permisos.Admin)]
public class AuditoriaController(AuditoriaHandler auditoria) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PaginadoDto<RegistroAuditoriaDto>>> Listar(
        [FromQuery] FiltroAuditoriaDto filtro, CancellationToken ct) =>
        Ok(await auditoria.ListarAsync(filtro, ct));

    [HttpGet("excel")]
    public async Task<IActionResult> Excel([FromQuery] FiltroAuditoriaDto filtro, CancellationToken ct)
    {
        var contenido = await auditoria.ExcelAsync(filtro, ct);

        return File(
            contenido,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"historial-cambios-{DateTime.UtcNow:yyyyMMdd}.xlsx");
    }
}
