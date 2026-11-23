namespace AgroCita.Domain.Entities;

public class AuditLog
{
    public long Id { get; set; }

    public int? EmpresaId { get; set; }

    public int? UsuarioId { get; set; }

    public string? Rol { get; set; }

    public string Entidad { get; set; } = string.Empty;

    public string EntidadId { get; set; } = string.Empty;

    public AuditAction Accion { get; set; }

    public string Cambios { get; set; } = "{}";

    public DateTime Fecha { get; set; }

    public User? Usuario { get; set; }
}

public enum AuditAction
{
    Creado,
    Modificado,
    Eliminado
}
