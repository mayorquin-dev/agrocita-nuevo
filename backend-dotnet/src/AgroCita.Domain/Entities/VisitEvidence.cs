using AgroCita.Domain.Common;

namespace AgroCita.Domain.Entities;

public class VisitEvidence : ITenantEntity
{
    public int Id { get; set; }

    public int EmpresaId { get; set; }

    public int VisitaId { get; set; }

    public int? CultivoId { get; set; }

    public int UsuarioId { get; set; }

    public string? Descripcion { get; set; }

    public string Archivo { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public long TamanoBytes { get; set; }

    public double? Latitud { get; set; }

    public double? Longitud { get; set; }

    public double? PrecisionMetros { get; set; }

    public DateTime FechaCaptura { get; set; }

    public DateTime FechaRegistro { get; set; }

    public Visit? Visita { get; set; }

    public Crop? Cultivo { get; set; }

    public User? Usuario { get; set; }

    public bool TieneUbicacion => Latitud is not null && Longitud is not null;
}
