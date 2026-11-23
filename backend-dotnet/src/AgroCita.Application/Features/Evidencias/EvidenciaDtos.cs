using AgroCita.Application.Common.Models;
using AgroCita.Application.Features.Fincas;
using AgroCita.Domain.Entities;
using FluentValidation;

namespace AgroCita.Application.Features.Evidencias;

public record SubirEvidenciaDto(
    Stream? Contenido,
    string? ContentType,
    long Tamano,
    int? CultivoId,
    string? Descripcion,
    double? Latitud,
    double? Longitud,
    double? PrecisionMetros,
    DateTime? FechaCaptura);

public record EvidenciaDto(
    int Id,
    int VisitaId,
    ReferenciaDto? Cultivo,
    string? Descripcion,
    string ContentType,
    long TamanoBytes,
    double? Latitud,
    double? Longitud,
    double? PrecisionMetros,
    DateTime FechaCaptura,
    DateTime FechaRegistro,
    string SubidoPor);

public record ArchivoDto(Stream Contenido, string ContentType, string NombreDescarga);

public static class EvidenciaMapeos
{
    public static readonly string[] Relaciones = ["Cultivo", "Usuario"];

    public static EvidenciaDto ADto(this VisitEvidence evidencia) => new(
        evidencia.Id,
        evidencia.VisitaId,
        evidencia.Cultivo?.AReferencia(),
        evidencia.Descripcion,
        evidencia.ContentType,
        evidencia.TamanoBytes,
        evidencia.Latitud,
        evidencia.Longitud,
        evidencia.PrecisionMetros,
        evidencia.FechaCaptura,
        evidencia.FechaRegistro,
        evidencia.Usuario?.NombreCompleto ?? string.Empty);
}

public static class LimitesEvidencia
{
    public const long TamanoMaximo = 10 * 1024 * 1024;

    public const int MaximoPorVisita = 40;

    public static readonly IReadOnlyDictionary<string, string> Tipos = new Dictionary<string, string>
    {
        ["image/jpeg"] = "jpg",
        ["image/png"] = "png",
        ["image/webp"] = "webp"
    };
}

public class SubirEvidenciaValidator : AbstractValidator<SubirEvidenciaDto>
{
    public SubirEvidenciaValidator()
    {
        RuleFor(x => x.Contenido)
            .NotNull().WithMessage("La foto es obligatoria.");

        RuleFor(x => x.Tamano)
            .GreaterThan(0).WithMessage("La foto está vacía.")
            .LessThanOrEqualTo(LimitesEvidencia.TamanoMaximo).WithMessage("La foto no puede superar los 10 MB.");

        RuleFor(x => x.ContentType)
            .Must(tipo => tipo is not null && LimitesEvidencia.Tipos.ContainsKey(tipo))
            .WithMessage("Solo se aceptan fotos JPG, PNG o WEBP.");

        RuleFor(x => x.Descripcion)
            .MaximumLength(250).WithMessage("La descripción no puede superar los 250 caracteres.");

        RuleFor(x => x.Latitud)
            .InclusiveBetween(-90, 90).WithMessage("La latitud no es válida.")
            .When(x => x.Latitud is not null);

        RuleFor(x => x.Longitud)
            .InclusiveBetween(-180, 180).WithMessage("La longitud no es válida.")
            .When(x => x.Longitud is not null);

        RuleFor(x => x.Longitud)
            .NotNull().WithMessage("La ubicación está incompleta.")
            .When(x => x.Latitud is not null);

        RuleFor(x => x.PrecisionMetros)
            .GreaterThanOrEqualTo(0).WithMessage("La precisión no es válida.")
            .When(x => x.PrecisionMetros is not null);

        RuleFor(x => x.FechaCaptura)
            .Must(f => f is null || f.Value.AUtc() <= Fechas.Ahora.AddMinutes(10))
            .WithMessage("La fecha de captura no puede ser futura.");
    }
}
