using AgroCita.Domain.Common;

namespace AgroCita.Domain.Entities;

public class Prescription : ITenantEntity
{
    public int Id { get; set; }

    public int EmpresaId { get; set; }

    public int VisitaId { get; set; }

    public int CultivoId { get; set; }

    public int? InsumoId { get; set; }

    public string Producto { get; set; } = string.Empty;

    public ProductType TipoProducto { get; set; }

    public decimal Dosis { get; set; }

    public string Unidad { get; set; } = string.Empty;

    public string? MetodoAplicacion { get; set; }

    public DateOnly FechaAplicacion { get; set; }

    public string? Indicaciones { get; set; }

    public PrescriptionStatus Estado { get; set; }

    public DateOnly? FechaAplicacionReal { get; set; }

    public string? ComentarioSeguimiento { get; set; }

    public DateTime? FechaRegistroSeguimiento { get; set; }

    public int? UsuarioSeguimientoId { get; set; }

    public DateTime FechaCreacion { get; set; }

    public Visit? Visita { get; set; }

    public Crop? Cultivo { get; set; }

    public User? UsuarioSeguimiento { get; set; }

    public Supply? Insumo { get; set; }

    public ICollection<SupplyMovement> Entregas { get; set; } = new List<SupplyMovement>();

    public bool EstaVencida(DateOnly hoy) =>
        Estado == PrescriptionStatus.Pendiente && FechaAplicacion < hoy;
}

public enum ProductType
{
    Fertilizante,
    Fungicida,
    Insecticida,
    Herbicida,
    Nematicida,
    Bioinsumo,
    Otro
}

public enum PrescriptionStatus
{
    Pendiente,
    Aplicada,
    NoAplicada
}
