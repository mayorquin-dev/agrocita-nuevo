using AgroCita.Domain.Common;

namespace AgroCita.Domain.Entities;

public class Supply : ITenantEntity
{
    public int Id { get; set; }

    public int EmpresaId { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public ProductType Tipo { get; set; }

    public string Unidad { get; set; } = string.Empty;

    public string? Presentacion { get; set; }

    public decimal Stock { get; set; }

    public decimal? StockMinimo { get; set; }

    public bool Activo { get; set; }

    public DateTime FechaCreacion { get; set; }

    public bool StockBajo => StockMinimo is not null && Stock <= StockMinimo;
}

public class SupplyMovement : ITenantEntity
{
    public int Id { get; set; }

    public int EmpresaId { get; set; }

    public int InsumoId { get; set; }

    public MovementType Tipo { get; set; }

    public decimal Cantidad { get; set; }

    public decimal StockResultante { get; set; }

    public int? ProductorId { get; set; }

    public int? RecetaId { get; set; }

    public string? Nota { get; set; }

    public DateOnly Fecha { get; set; }

    public int UsuarioId { get; set; }

    public DateTime FechaRegistro { get; set; }

    public Supply? Insumo { get; set; }

    public Producer? Productor { get; set; }

    public Prescription? Receta { get; set; }

    public User? Usuario { get; set; }
}

public enum MovementType
{
    Entrada,
    Entrega,
    Ajuste
}
