using AgroCita.Application.Common.Exceptions;
using AgroCita.Application.Common.Interfaces;
using AgroCita.Application.Common.Models;
using AgroCita.Application.Common.Services;
using AgroCita.Application.Features.Productores;
using AgroCita.Domain.Entities;
using FluentValidation;

namespace AgroCita.Application.Features.Inventario;

public record GuardarInsumoDto(
    string Nombre,
    ProductType? Tipo,
    string Unidad,
    string? Presentacion,
    decimal? StockMinimo,
    bool Activo = true);

public record MovimientoInsumoDto(
    MovementType? Tipo,
    decimal? Cantidad,
    int? ProductorId,
    int? RecetaId,
    DateOnly? Fecha,
    string? Nota);

public record InsumoDto(
    int Id,
    string Nombre,
    ProductType Tipo,
    string Unidad,
    string? Presentacion,
    decimal Stock,
    decimal? StockMinimo,
    bool Activo,
    bool StockBajo);

public record MovimientoDto(
    int Id,
    ReferenciaDto Insumo,
    string Unidad,
    MovementType Tipo,
    decimal Cantidad,
    decimal StockResultante,
    ReferenciaDto? Productor,
    int? RecetaId,
    int? VisitaId,
    DateOnly Fecha,
    string? Nota,
    string RegistradoPor,
    DateTime FechaRegistro);

public static class InventarioMapeos
{
    public static readonly string[] RelacionesMovimiento =
        ["Insumo", "Productor.Usuario", "Receta", "Usuario"];

    public static InsumoDto ADto(this Supply insumo) => new(
        insumo.Id,
        insumo.Nombre,
        insumo.Tipo,
        insumo.Unidad,
        insumo.Presentacion,
        insumo.Stock,
        insumo.StockMinimo,
        insumo.Activo,
        insumo.StockBajo);

    public static MovimientoDto ADto(this SupplyMovement movimiento) => new(
        movimiento.Id,
        new ReferenciaDto(movimiento.InsumoId, movimiento.Insumo?.Nombre ?? string.Empty),
        movimiento.Insumo?.Unidad ?? string.Empty,
        movimiento.Tipo,
        movimiento.Cantidad,
        movimiento.StockResultante,
        movimiento.Productor?.AReferencia(),
        movimiento.RecetaId,
        movimiento.Receta?.VisitaId,
        movimiento.Fecha,
        movimiento.Nota,
        movimiento.Usuario?.NombreCompleto ?? string.Empty,
        movimiento.FechaRegistro);
}

public class GuardarInsumoValidator : AbstractValidator<GuardarInsumoDto>
{
    public GuardarInsumoValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre es obligatorio.")
            .MaximumLength(120).WithMessage("El nombre no puede superar los 120 caracteres.");

        RuleFor(x => x.Tipo)
            .NotNull().WithMessage("El tipo es obligatorio.")
            .IsInEnum().WithMessage("El tipo no es válido.");

        RuleFor(x => x.Unidad)
            .NotEmpty().WithMessage("La unidad es obligatoria.")
            .MaximumLength(30).WithMessage("La unidad no puede superar los 30 caracteres.");

        RuleFor(x => x.Presentacion)
            .MaximumLength(80).WithMessage("La presentación no puede superar los 80 caracteres.");

        RuleFor(x => x.StockMinimo)
            .GreaterThanOrEqualTo(0).WithMessage("El stock mínimo no puede ser negativo.")
            .When(x => x.StockMinimo is not null);
    }
}

public class MovimientoInsumoValidator : AbstractValidator<MovimientoInsumoDto>
{
    public MovimientoInsumoValidator()
    {
        RuleFor(x => x.Tipo)
            .NotNull().WithMessage("El tipo de movimiento es obligatorio.")
            .IsInEnum().WithMessage("El tipo de movimiento no es válido.");

        RuleFor(x => x.Cantidad)
            .NotNull().WithMessage("La cantidad es obligatoria.")
            .NotEqual(0).WithMessage("La cantidad no puede ser cero.")
            .Must(c => c is null || Math.Abs(c.Value) < 1_000_000_000).WithMessage("La cantidad es demasiado grande.");

        RuleFor(x => x.Cantidad)
            .GreaterThan(0).WithMessage("La cantidad debe ser mayor que cero.")
            .When(x => x.Tipo is MovementType.Entrada or MovementType.Entrega);

        RuleFor(x => x.ProductorId)
            .NotNull().WithMessage("Indica a qué productor se entrega.")
            .When(x => x.Tipo == MovementType.Entrega && x.RecetaId is null);

        RuleFor(x => x.Nota)
            .NotEmpty().WithMessage("Explica el motivo del ajuste.")
            .When(x => x.Tipo == MovementType.Ajuste);

        RuleFor(x => x.Nota)
            .MaximumLength(300).WithMessage("La nota no puede superar los 300 caracteres.");

        RuleFor(x => x.Fecha)
            .Must(f => f is null || f.Value <= Fechas.Hoy).WithMessage("La fecha no puede ser futura.");
    }
}

public class InventarioHandler(
    ActorActual actor,
    IRepository<Supply> insumos,
    IRepository<SupplyMovement> movimientos,
    IRepository<Producer> productores,
    IRepository<Prescription> recetas,
    IUnitOfWork unitOfWork,
    IValidator<GuardarInsumoDto> insumoValidator,
    IValidator<MovimientoInsumoDto> movimientoValidator)
{
    public async Task<IReadOnlyList<InsumoDto>> ListarAsync(bool soloActivos, CancellationToken ct)
    {
        var lista = await insumos.ListAsync(
            i => !soloActivos || i.Activo,
            q => q.OrderBy(i => i.Nombre),
            ct: ct);

        return lista.Select(i => i.ADto()).ToList();
    }

    public async Task<InsumoDto> CrearAsync(GuardarInsumoDto dto, CancellationToken ct)
    {
        await insumoValidator.ValidateAndThrowAsync(dto, ct);
        await ExigirNombreLibreAsync(dto.Nombre.Trim(), 0, ct);

        var insumo = new Supply { FechaCreacion = Fechas.Ahora };
        Aplicar(insumo, dto);

        insumos.Add(insumo);
        await unitOfWork.SaveChangesAsync(ct);

        return insumo.ADto();
    }

    public async Task<InsumoDto> ActualizarAsync(int id, GuardarInsumoDto dto, CancellationToken ct)
    {
        await insumoValidator.ValidateAndThrowAsync(dto, ct);

        var insumo = await insumos.FirstAsync(i => i.Id == id, ct: ct)
            ?? throw new NotFoundException("El insumo no existe.");

        await ExigirNombreLibreAsync(dto.Nombre.Trim(), id, ct);
        Aplicar(insumo, dto);
        await unitOfWork.SaveChangesAsync(ct);

        return insumo.ADto();
    }

    public async Task<MovimientoDto> RegistrarMovimientoAsync(int insumoId, MovimientoInsumoDto dto, CancellationToken ct)
    {
        await movimientoValidator.ValidateAndThrowAsync(dto, ct);

        var insumo = await insumos.FirstAsync(i => i.Id == insumoId, ct: ct)
            ?? throw new NotFoundException("El insumo no existe.");

        var cantidad = dto.Cantidad!.Value;
        int? productorId = dto.ProductorId;
        Prescription? receta = null;

        if (dto.Tipo == MovementType.Entrega)
        {
            if (!insumo.Activo)
            {
                throw new ConflictException("El insumo está inactivo.");
            }

            if (dto.RecetaId is int recetaId)
            {
                receta = await recetas.FirstAsync(r => r.Id == recetaId, ["Visita.Solicitud.Finca"], ct: ct)
                    ?? throw Errores.Campo(nameof(dto.RecetaId), "La receta no existe.");

                var productorReceta = receta.Visita!.Solicitud!.Finca!.ProductorId;

                if (productorId is not null && productorId != productorReceta)
                {
                    throw Errores.Campo(nameof(dto.ProductorId), "La receta es de otro productor.");
                }

                if (receta.InsumoId is not null && receta.InsumoId != insumo.Id)
                {
                    throw Errores.Campo(nameof(dto.RecetaId), "La receta indica otro insumo.");
                }

                productorId = productorReceta;
            }
            else if (!await productores.AnyAsync(p => p.Id == productorId, ct: ct))
            {
                throw Errores.Campo(nameof(dto.ProductorId), "El productor no existe.");
            }

            if (cantidad > insumo.Stock)
            {
                throw Errores.Campo(
                    nameof(dto.Cantidad),
                    $"Solo hay {insumo.Stock:0.###} {insumo.Unidad} en existencia.");
            }

            insumo.Stock -= cantidad;
        }
        else
        {
            productorId = null;

            if (insumo.Stock + cantidad < 0)
            {
                throw Errores.Campo(nameof(dto.Cantidad), "El ajuste dejaría la existencia en negativo.");
            }

            insumo.Stock += cantidad;
        }

        var movimiento = new SupplyMovement
        {
            InsumoId = insumo.Id,
            Tipo = dto.Tipo!.Value,
            Cantidad = cantidad,
            StockResultante = insumo.Stock,
            ProductorId = productorId,
            RecetaId = receta?.Id,
            Nota = string.IsNullOrWhiteSpace(dto.Nota) ? null : dto.Nota.Trim(),
            Fecha = dto.Fecha ?? Fechas.Hoy,
            UsuarioId = actor.UsuarioId,
            FechaRegistro = Fechas.Ahora
        };

        movimientos.Add(movimiento);
        await unitOfWork.SaveChangesAsync(ct);

        var guardado = await movimientos.FirstAsync(m => m.Id == movimiento.Id, InventarioMapeos.RelacionesMovimiento, ct: ct);

        return guardado!.ADto();
    }

    public async Task<PaginadoDto<MovimientoDto>> MovimientosAsync(
        int? insumoId, int? productorId, MovementType? tipo, int? pagina, int? tamano, CancellationToken ct)
    {
        if (actor.EsProductor)
        {
            productorId = (await actor.ProductorAsync(ct)).Id;
            tipo = MovementType.Entrega;
        }

        var (p, t, saltar) = Paginacion.Normalizar(pagina, tamano);

        System.Linq.Expressions.Expression<Func<SupplyMovement, bool>> condicion = m =>
            (insumoId == null || m.InsumoId == insumoId) &&
            (productorId == null || m.ProductorId == productorId) &&
            (tipo == null || m.Tipo == tipo);

        var total = await movimientos.CountAsync(condicion, ct: ct);
        var lista = await movimientos.ListAsync(
            condicion,
            q => q.OrderByDescending(m => m.Fecha).ThenByDescending(m => m.Id),
            saltar,
            t,
            InventarioMapeos.RelacionesMovimiento,
            ct: ct);

        return new PaginadoDto<MovimientoDto>(lista.Select(m => m.ADto()).ToList(), total, p, t);
    }

    private async Task ExigirNombreLibreAsync(string nombre, int id, CancellationToken ct)
    {
        var minuscula = nombre.ToLower();

        if (await insumos.AnyAsync(i => i.Id != id && i.Nombre.ToLower() == minuscula, ct: ct))
        {
            throw Errores.Campo(nameof(GuardarInsumoDto.Nombre), "Ya existe un insumo con ese nombre.");
        }
    }

    private static void Aplicar(Supply insumo, GuardarInsumoDto dto)
    {
        insumo.Nombre = dto.Nombre.Trim();
        insumo.Tipo = dto.Tipo!.Value;
        insumo.Unidad = dto.Unidad.Trim();
        insumo.Presentacion = string.IsNullOrWhiteSpace(dto.Presentacion) ? null : dto.Presentacion.Trim();
        insumo.StockMinimo = dto.StockMinimo;
        insumo.Activo = dto.Activo;
    }
}
