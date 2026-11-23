using System.Linq.Expressions;
using System.Text.Json;
using AgroCita.Application.Common.Exceptions;
using AgroCita.Application.Common.Interfaces;
using AgroCita.Application.Common.Models;
using AgroCita.Domain.Entities;

namespace AgroCita.Application.Features.Auditoria;

public record CambioCampoDto(string Campo, string? Antes, string? Despues);

public record RegistroAuditoriaDto(
    long Id,
    DateTime Fecha,
    string Usuario,
    string? Rol,
    string Entidad,
    string EntidadId,
    AuditAction Accion,
    IReadOnlyList<CambioCampoDto> Cambios);

public record FiltroAuditoriaDto(
    string? Entidad,
    string? EntidadId,
    int? UsuarioId,
    AuditAction? Accion,
    DateOnly? Desde,
    DateOnly? Hasta,
    int? Pagina,
    int? Tamano);

public class AuditoriaHandler(IRepository<AuditLog> registros, IExcelExporter excel)
{
    private static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true };

    private sealed record CambioGuardado(string? Antes, string? Despues);

    public async Task<PaginadoDto<RegistroAuditoriaDto>> ListarAsync(FiltroAuditoriaDto filtro, CancellationToken ct)
    {
        var (pagina, tamano, saltar) = Paginacion.Normalizar(filtro.Pagina, filtro.Tamano);
        var condicion = Condicion(filtro);

        var total = await registros.CountAsync(condicion, ct: ct);
        var lista = await registros.ListAsync(
            condicion,
            q => q.OrderByDescending(r => r.Fecha).ThenByDescending(r => r.Id),
            saltar,
            tamano,
            ["Usuario"],
            ct: ct);

        return new PaginadoDto<RegistroAuditoriaDto>(lista.Select(ADto).ToList(), total, pagina, tamano);
    }

    public async Task<byte[]> ExcelAsync(FiltroAuditoriaDto filtro, CancellationToken ct)
    {
        var lista = await registros.ListAsync(
            Condicion(filtro),
            q => q.OrderByDescending(r => r.Fecha).ThenByDescending(r => r.Id),
            tomar: 20_000,
            incluir: ["Usuario"],
            ct: ct);

        var filas = lista
            .Select(ADto)
            .SelectMany(r => (r.Cambios.Count == 0 ? [new CambioCampoDto("", null, null)] : r.Cambios)
                .Select(c => new object?[] { r.Fecha, r.Usuario, r.Rol, r.Entidad, r.EntidadId, r.Accion.ToString(), c.Campo, c.Antes, c.Despues }))
            .ToList();

        return excel.Generar(
        [
            new HojaExcel(
                "Historial de cambios",
                ["Fecha (UTC)", "Usuario", "Rol", "Registro", "Id", "Acción", "Campo", "Antes", "Después"],
                filas)
        ]);
    }

    private static Expression<Func<AuditLog, bool>> Condicion(FiltroAuditoriaDto filtro)
    {
        if (filtro.Desde is not null && filtro.Hasta is not null && filtro.Desde > filtro.Hasta)
        {
            throw Errores.Campo("desde", "La fecha inicial no puede ser posterior a la final.");
        }

        DateTime? inicio = filtro.Desde?.InicioUtc();
        DateTime? fin = filtro.Hasta?.AddDays(1).InicioUtc();
        var entidad = string.IsNullOrWhiteSpace(filtro.Entidad) ? null : filtro.Entidad.Trim();
        var entidadId = string.IsNullOrWhiteSpace(filtro.EntidadId) ? null : filtro.EntidadId.Trim();

        return r =>
            (entidad == null || r.Entidad == entidad) &&
            (entidadId == null || r.EntidadId == entidadId) &&
            (filtro.UsuarioId == null || r.UsuarioId == filtro.UsuarioId) &&
            (filtro.Accion == null || r.Accion == filtro.Accion) &&
            (inicio == null || r.Fecha >= inicio) &&
            (fin == null || r.Fecha < fin);
    }

    private static RegistroAuditoriaDto ADto(AuditLog registro)
    {
        Dictionary<string, CambioGuardado>? cambios = null;

        try
        {
            cambios = JsonSerializer.Deserialize<Dictionary<string, CambioGuardado>>(registro.Cambios, Json);
        }
        catch (JsonException)
        {
        }

        return new RegistroAuditoriaDto(
            registro.Id,
            registro.Fecha,
            registro.Usuario?.NombreCompleto ?? (registro.UsuarioId is null ? "Sistema" : $"Usuario {registro.UsuarioId}"),
            registro.Rol,
            registro.Entidad,
            registro.EntidadId,
            registro.Accion,
            (cambios ?? []).Select(c => new CambioCampoDto(c.Key, c.Value.Antes, c.Value.Despues)).ToList());
    }
}
