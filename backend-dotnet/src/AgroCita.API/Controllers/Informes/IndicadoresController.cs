using AgroCita.Application.Features.Busqueda;
using AgroCita.Application.Features.Indicadores;
using AgroCita.Application.Features.Trazabilidad;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgroCita.API.Controllers.Informes;

internal static class TiposArchivo
{
    public const string Excel = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}

[ApiController]
[Route("api/indicadores")]
[Authorize(Roles = Permisos.Admin)]
public class IndicadoresController(IndicadoresHandler indicadores) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IndicadoresDto>> Obtener(
        [FromQuery] DateOnly? desde, [FromQuery] DateOnly? hasta, CancellationToken ct) =>
        Ok(await indicadores.ObtenerAsync(desde, hasta, ct));

    [HttpGet("excel")]
    public async Task<IActionResult> Excel(
        [FromQuery] DateOnly? desde, [FromQuery] DateOnly? hasta, CancellationToken ct)
    {
        var contenido = await indicadores.ExcelAsync(desde, hasta, ct);

        return File(contenido, TiposArchivo.Excel, $"indicadores-{DateTime.UtcNow:yyyyMMdd}.xlsx");
    }
}

[ApiController]
[Route("api/trazabilidad")]
[Authorize(Roles = Permisos.AdminOProductor)]
public class TrazabilidadController(TrazabilidadHandler trazabilidad) : ControllerBase
{
    [HttpGet("cultivos/{cultivoId:int}")]
    public async Task<ActionResult<TrazabilidadDto>> Obtener(
        int cultivoId, [FromQuery] DateOnly? desde, [FromQuery] DateOnly? hasta, CancellationToken ct) =>
        Ok(await trazabilidad.ObtenerAsync(cultivoId, desde, hasta, ct));

    [HttpGet("cultivos/{cultivoId:int}/excel")]
    public async Task<IActionResult> Excel(
        int cultivoId, [FromQuery] DateOnly? desde, [FromQuery] DateOnly? hasta, CancellationToken ct)
    {
        var (contenido, nombre) = await trazabilidad.ExcelAsync(cultivoId, desde, hasta, ct);

        return File(contenido, TiposArchivo.Excel, nombre);
    }
}

[ApiController]
[Route("api/buscar")]
[Authorize(Roles = Permisos.Empresa)]
public class BusquedaController(BusquedaHandler busqueda) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ResultadoBusquedaDto>>> Buscar(
        [FromQuery] string? q, CancellationToken ct) =>
        Ok(await busqueda.BuscarAsync(q, ct));
}
