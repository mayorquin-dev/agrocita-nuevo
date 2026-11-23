using System.Security.Cryptography;
using AgroCita.Application.Common.Exceptions;
using AgroCita.Application.Common.Interfaces;
using AgroCita.Application.Common.Services;
using AgroCita.Domain.Entities;

namespace AgroCita.Application.Features.Empresa;

public class EmpresaHandler(
    IRepository<Company> empresas,
    IUnitOfWork unitOfWork,
    SuscripcionService suscripcion,
    IFileStorage almacenamiento)
{
    private const string Caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public const long LogoMaximo = 2 * 1024 * 1024;

    private static readonly Dictionary<string, string> TiposLogo = new()
    {
        ["image/png"] = "png",
        ["image/jpeg"] = "jpg",
        ["image/webp"] = "webp"
    };

    public async Task<EmpresaDto> SubirLogoAsync(Stream? contenido, string? contentType, long tamano, CancellationToken ct)
    {
        if (contenido is null || tamano <= 0)
        {
            throw Errores.Campo("archivo", "El logo es obligatorio.");
        }

        if (tamano > LogoMaximo)
        {
            throw Errores.Campo("archivo", "El logo no puede superar los 2 MB.");
        }

        if (contentType is null || !TiposLogo.TryGetValue(contentType, out var extension))
        {
            throw Errores.Campo("archivo", "El logo debe ser PNG, JPG o WEBP.");
        }

        var empresa = await ActualAsync(ct);
        var anterior = empresa.LogoArchivo;

        empresa.LogoArchivo = await almacenamiento.GuardarAsync(contenido, "logos", extension, ct);
        empresa.LogoContentType = contentType;
        await unitOfWork.SaveChangesAsync(ct);

        if (anterior is not null)
        {
            almacenamiento.Eliminar(anterior);
        }

        return empresa.ADto();
    }

    public async Task<EmpresaDto> EliminarLogoAsync(CancellationToken ct)
    {
        var empresa = await ActualAsync(ct);
        var anterior = empresa.LogoArchivo;

        empresa.LogoArchivo = null;
        empresa.LogoContentType = null;
        await unitOfWork.SaveChangesAsync(ct);

        if (anterior is not null)
        {
            almacenamiento.Eliminar(anterior);
        }

        return empresa.ADto();
    }

    public async Task<Evidencias.ArchivoDto> LogoAsync(CancellationToken ct)
    {
        var empresa = await ActualAsync(ct);

        var contenido = (empresa.LogoArchivo is null ? null : almacenamiento.Abrir(empresa.LogoArchivo))
            ?? throw new NotFoundException("La organización no tiene logo.");

        return new Evidencias.ArchivoDto(contenido, empresa.LogoContentType ?? "image/png", "logo");
    }

    public async Task<EmpresaDto> ObtenerAsync(CancellationToken ct) =>
        (await ActualAsync(ct)).ADto();

    public async Task<EmpresaDto> RegenerarCodigoAsync(CancellationToken ct)
    {
        var empresa = await ActualAsync(ct);

        empresa.CodigoInvitacion = await GenerarCodigoAsync(empresas, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return empresa.ADto();
    }

    public async Task<SuscripcionDto> ObtenerSuscripcionAsync(CancellationToken ct)
    {
        var vigente = await suscripcion.VigenteAsync(ct)
            ?? throw new NotFoundException("La organización no tiene una suscripción asignada.");

        return vigente.ADto();
    }

    public static async Task<string> GenerarCodigoAsync(
        IRepository<Company> empresas, CancellationToken ct)
    {
        while (true)
        {
            var codigo = RandomNumberGenerator.GetString(Caracteres, 12);

            if (!await empresas.AnyAsync(
                    e => e.CodigoInvitacion == codigo, sinFiltroEmpresa: true, ct))
            {
                return codigo;
            }
        }
    }

    private async Task<Company> ActualAsync(CancellationToken ct) =>
        await empresas.FirstAsync(e => true, ct: ct)
        ?? throw new NotFoundException("La organización no existe.");
}
