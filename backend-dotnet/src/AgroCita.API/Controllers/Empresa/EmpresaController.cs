using AgroCita.API.Filters;
using AgroCita.Application.Features.Empresa;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgroCita.API.Controllers.Empresa;

[ApiController]
[Route("api/empresa")]
[Authorize(Roles = Permisos.Admin)]
public class EmpresaController(EmpresaHandler empresa) : ControllerBase
{
    [HttpGet]
    [SinValidarSuscripcion]
    public async Task<ActionResult<EmpresaDto>> Obtener(CancellationToken ct) =>
        Ok(await empresa.ObtenerAsync(ct));

    [HttpPost("codigo-invitacion")]
    public async Task<ActionResult<EmpresaDto>> RegenerarCodigo(CancellationToken ct) =>
        Ok(await empresa.RegenerarCodigoAsync(ct));

    [HttpGet("suscripcion")]
    [SinValidarSuscripcion]
    public async Task<ActionResult<SuscripcionDto>> Suscripcion(CancellationToken ct) =>
        Ok(await empresa.ObtenerSuscripcionAsync(ct));

    [HttpPost("logo")]
    [RequestSizeLimit(EmpresaHandler.LogoMaximo + 512 * 1024)]
    public async Task<ActionResult<EmpresaDto>> SubirLogo(IFormFile? archivo, CancellationToken ct)
    {
        await using var contenido = archivo?.OpenReadStream();

        return Ok(await empresa.SubirLogoAsync(contenido, archivo?.ContentType, archivo?.Length ?? 0, ct));
    }

    [HttpDelete("logo")]
    public async Task<ActionResult<EmpresaDto>> EliminarLogo(CancellationToken ct) =>
        Ok(await empresa.EliminarLogoAsync(ct));
}

[ApiController]
[Route("api/empresa/logo")]
[Authorize(Roles = Permisos.Empresa)]
public class LogoEmpresaController(EmpresaHandler empresa) : ControllerBase
{
    [HttpGet]
    [SinValidarSuscripcion]
    public async Task<IActionResult> Obtener(CancellationToken ct)
    {
        var logo = await empresa.LogoAsync(ct);

        Response.Headers.CacheControl = "private, max-age=300";

        return File(logo.Contenido, logo.ContentType);
    }
}
