using AgroCita.Application.Common.Models;
using AgroCita.Application.Features.Fincas;
using AgroCita.Application.Features.Productores;
using AgroCita.Application.Features.Tecnicos;
using AgroCita.Domain.Entities;
using FluentValidation;

namespace AgroCita.Application.Features.Recetas;

public record CrearRecetaDto(
    int CultivoId,
    string Producto,
    ProductType? TipoProducto,
    decimal? Dosis,
    string Unidad,
    string? MetodoAplicacion,
    DateOnly? FechaAplicacion,
    string? Indicaciones);

public record SeguimientoRecetaDto(
    PrescriptionStatus? Estado,
    DateOnly? FechaAplicacionReal,
    string? Comentario);

public record RecetaDto(
    int Id,
    int VisitaId,
    ReferenciaDto Cultivo,
    ReferenciaDto Finca,
    ReferenciaDto Productor,
    ReferenciaDto Tecnico,
    string Producto,
    ProductType TipoProducto,
    decimal Dosis,
    string Unidad,
    string? MetodoAplicacion,
    DateOnly FechaAplicacion,
    string? Indicaciones,
    PrescriptionStatus Estado,
    DateOnly? FechaAplicacionReal,
    string? ComentarioSeguimiento,
    DateTime? FechaRegistroSeguimiento,
    string? RegistradoPor,
    bool Vencida,
    DateTime FechaCreacion);

public static class RecetaMapeos
{
    public static readonly string[] Relaciones =
    [
        "Cultivo",
        "Visita.Solicitud.Finca.Productor.Usuario",
        "Visita.Tecnico.Usuario",
        "UsuarioSeguimiento"
    ];

    public static RecetaDto ADto(this Prescription receta)
    {
        var finca = receta.Visita?.Solicitud?.Finca;
        var vacia = new ReferenciaDto(0, string.Empty);

        return new RecetaDto(
            receta.Id,
            receta.VisitaId,
            receta.Cultivo?.AReferencia() ?? new ReferenciaDto(receta.CultivoId, string.Empty),
            finca?.AReferencia() ?? vacia,
            finca?.Productor?.AReferencia() ?? vacia,
            receta.Visita?.Tecnico?.AReferencia() ?? vacia,
            receta.Producto,
            receta.TipoProducto,
            receta.Dosis,
            receta.Unidad,
            receta.MetodoAplicacion,
            receta.FechaAplicacion,
            receta.Indicaciones,
            receta.Estado,
            receta.FechaAplicacionReal,
            receta.ComentarioSeguimiento,
            receta.FechaRegistroSeguimiento,
            receta.UsuarioSeguimiento?.NombreCompleto,
            receta.EstaVencida(Fechas.Hoy),
            receta.FechaCreacion);
    }
}

public class CrearRecetaValidator : AbstractValidator<CrearRecetaDto>
{
    public CrearRecetaValidator()
    {
        RuleFor(x => x.CultivoId)
            .GreaterThan(0).WithMessage("El cultivo es obligatorio.");

        RuleFor(x => x.Producto)
            .NotEmpty().WithMessage("El producto es obligatorio.")
            .MaximumLength(120).WithMessage("El producto no puede superar los 120 caracteres.");

        RuleFor(x => x.TipoProducto)
            .NotNull().WithMessage("El tipo de producto es obligatorio.")
            .IsInEnum().WithMessage("El tipo de producto no es válido.");

        RuleFor(x => x.Dosis)
            .NotNull().WithMessage("La dosis es obligatoria.")
            .GreaterThan(0).WithMessage("La dosis debe ser mayor que cero.")
            .LessThan(1_000_000).WithMessage("La dosis es demasiado grande.");

        RuleFor(x => x.Unidad)
            .NotEmpty().WithMessage("La unidad es obligatoria.")
            .MaximumLength(30).WithMessage("La unidad no puede superar los 30 caracteres.");

        RuleFor(x => x.MetodoAplicacion)
            .MaximumLength(100).WithMessage("El método de aplicación no puede superar los 100 caracteres.");

        RuleFor(x => x.FechaAplicacion)
            .NotNull().WithMessage("La fecha de aplicación es obligatoria.")
            .Must(f => f is null || f.Value >= Fechas.Hoy)
            .WithMessage("La fecha de aplicación no puede ser pasada.")
            .Must(f => f is null || f.Value <= Fechas.Hoy.AddDays(365))
            .WithMessage("La fecha de aplicación no puede superar un año.");

        RuleFor(x => x.Indicaciones)
            .MaximumLength(500).WithMessage("Las indicaciones no pueden superar los 500 caracteres.");
    }
}

public class SeguimientoRecetaValidator : AbstractValidator<SeguimientoRecetaDto>
{
    public SeguimientoRecetaValidator()
    {
        RuleFor(x => x.Estado)
            .NotNull().WithMessage("Indica si el producto se aplicó.")
            .Must(e => e is null or PrescriptionStatus.Aplicada or PrescriptionStatus.NoAplicada)
            .WithMessage("Indica si el producto se aplicó o no.");

        RuleFor(x => x.FechaAplicacionReal)
            .NotNull().WithMessage("La fecha en que se aplicó es obligatoria.")
            .When(x => x.Estado == PrescriptionStatus.Aplicada);

        RuleFor(x => x.FechaAplicacionReal)
            .Must(f => f is null || f.Value <= Fechas.Hoy)
            .WithMessage("La fecha de aplicación no puede ser futura.");

        RuleFor(x => x.Comentario)
            .NotEmpty().WithMessage("Explica por qué no se aplicó.")
            .When(x => x.Estado == PrescriptionStatus.NoAplicada);

        RuleFor(x => x.Comentario)
            .MaximumLength(500).WithMessage("El comentario no puede superar los 500 caracteres.");
    }
}
