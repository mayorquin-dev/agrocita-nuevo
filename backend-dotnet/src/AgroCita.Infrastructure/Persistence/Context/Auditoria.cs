using System.Globalization;
using System.Text.Json;
using AgroCita.Application.Common.Interfaces;
using AgroCita.Domain.Common;
using AgroCita.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace AgroCita.Infrastructure.Persistence.Context;

internal static class Auditoria
{
    private const int LargoMaximo = 400;

    private static readonly HashSet<string> CamposOmitidos =
    [
        nameof(User.PasswordHash),
        nameof(ITenantEntity.EmpresaId)
    ];

    public sealed class Pendiente(
        EntityEntry entrada,
        AuditAction accion,
        Dictionary<string, CambioCampo> cambios,
        int? empresaId,
        int? usuarioId,
        string? rol)
    {
        public AuditLog Construir()
        {
            var clave = entrada.Metadata.FindPrimaryKey()!.Properties
                .Select(p => Convert.ToString(entrada.Property(p.Name).CurrentValue, CultureInfo.InvariantCulture))
                .ToList();

            var empresa = empresaId ?? EmpresaDe(entrada);

            return new AuditLog
            {
                EmpresaId = empresa,
                UsuarioId = usuarioId,
                Rol = rol,
                Entidad = entrada.Metadata.GetTableName() ?? entrada.Metadata.ClrType.Name,
                EntidadId = string.Join("-", clave),
                Accion = accion,
                Cambios = JsonSerializer.Serialize(cambios),
                Fecha = DateTime.UtcNow
            };
        }
    }

    public sealed record CambioCampo(string? Antes, string? Despues);

    public static List<Pendiente> Capturar(ChangeTracker tracker, ICurrentUserService usuario)
    {
        tracker.DetectChanges();

        var pendientes = new List<Pendiente>();

        foreach (var entrada in tracker.Entries())
        {
            if (entrada.Entity is AuditLog ||
                entrada.State is not (EntityState.Added or EntityState.Modified or EntityState.Deleted))
            {
                continue;
            }

            var cambios = new Dictionary<string, CambioCampo>();

            foreach (var propiedad in entrada.Properties)
            {
                var nombre = propiedad.Metadata.Name;

                if (CamposOmitidos.Contains(nombre) || propiedad.Metadata.IsShadowProperty())
                {
                    continue;
                }

                switch (entrada.State)
                {
                    case EntityState.Added:
                        if (!propiedad.Metadata.IsPrimaryKey() && propiedad.CurrentValue is not null)
                        {
                            cambios[nombre] = new CambioCampo(null, Texto(propiedad.CurrentValue));
                        }
                        break;

                    case EntityState.Modified:
                        if (propiedad.IsModified && !Equals(propiedad.OriginalValue, propiedad.CurrentValue))
                        {
                            cambios[nombre] = new CambioCampo(Texto(propiedad.OriginalValue), Texto(propiedad.CurrentValue));
                        }
                        break;

                    case EntityState.Deleted:
                        if (propiedad.OriginalValue is not null)
                        {
                            cambios[nombre] = new CambioCampo(Texto(propiedad.OriginalValue), null);
                        }
                        break;
                }
            }

            if (entrada.State == EntityState.Modified && cambios.Count == 0)
            {
                continue;
            }

            var accion = entrada.State switch
            {
                EntityState.Added => AuditAction.Creado,
                EntityState.Deleted => AuditAction.Eliminado,
                _ => AuditAction.Modificado
            };

            pendientes.Add(new Pendiente(entrada, accion, cambios, usuario.EmpresaId, usuario.UsuarioId, usuario.Rol));
        }

        return pendientes;
    }

    private static int? EmpresaDe(EntityEntry entrada) => entrada.Entity switch
    {
        ITenantEntity conEmpresa => conEmpresa.EmpresaId,
        User usuario => usuario.EmpresaId,
        Company empresa => empresa.Id,
        _ => null
    };

    private static string? Texto(object? valor)
    {
        var texto = valor switch
        {
            null => null,
            DateTime fecha => fecha.ToString("yyyy-MM-ddTHH:mm:ss'Z'", CultureInfo.InvariantCulture),
            DateOnly dia => dia.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            IFormattable formateable => formateable.ToString(null, CultureInfo.InvariantCulture),
            _ => valor.ToString()
        };

        return texto is { Length: > LargoMaximo } ? texto[..LargoMaximo] + "…" : texto;
    }
}
