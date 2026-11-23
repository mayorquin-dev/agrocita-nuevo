using System.Linq.Expressions;
using AgroCita.Application.Common.Exceptions;
using AgroCita.Application.Common.Interfaces;
using AgroCita.Application.Common.Models;
using AgroCita.Application.Common.Services;
using AgroCita.Domain.Entities;
using FluentValidation;

namespace AgroCita.Application.Features.Recetas;

public class RecetasHandler(
    ActorActual actor,
    IRepository<Prescription> recetas,
    IUnitOfWork unitOfWork,
    IValidator<CrearRecetaDto> crearValidator,
    IValidator<SeguimientoRecetaDto> seguimientoValidator)
{
    public async Task<RecetaDto> CrearAsync(int visitaId, CrearRecetaDto dto, CancellationToken ct)
    {
        await crearValidator.ValidateAndThrowAsync(dto, ct);

        var visita = await actor.VisitaAsync(visitaId, true, ct, "Solicitud.Cultivos");

        if (visita.Estado != VisitStatus.EnProceso)
        {
            throw new ConflictException("La receta solo se emite mientras la visita está en proceso.");
        }

        if (visita.Solicitud!.Cultivos.All(c => c.CultivoId != dto.CultivoId))
        {
            throw Errores.Campo(nameof(dto.CultivoId), "El cultivo no pertenece a esta visita.");
        }

        var receta = new Prescription
        {
            VisitaId = visita.Id,
            CultivoId = dto.CultivoId,
            Producto = dto.Producto.Trim(),
            TipoProducto = dto.TipoProducto!.Value,
            Dosis = dto.Dosis!.Value,
            Unidad = dto.Unidad.Trim(),
            MetodoAplicacion = Limpiar(dto.MetodoAplicacion),
            FechaAplicacion = dto.FechaAplicacion!.Value,
            Indicaciones = Limpiar(dto.Indicaciones),
            Estado = PrescriptionStatus.Pendiente,
            FechaCreacion = Fechas.Ahora
        };

        recetas.Add(receta);
        await unitOfWork.SaveChangesAsync(ct);

        return await ObtenerDtoAsync(receta.Id, ct);
    }

    public async Task<IReadOnlyList<RecetaDto>> ListarPorVisitaAsync(int visitaId, CancellationToken ct)
    {
        await actor.VisitaAsync(visitaId, false, ct);

        var lista = await recetas.ListAsync(
            r => r.VisitaId == visitaId,
            q => q.OrderBy(r => r.FechaAplicacion).ThenBy(r => r.Id),
            incluir: RecetaMapeos.Relaciones,
            ct: ct);

        return lista.Select(r => r.ADto()).ToList();
    }

    public async Task<IReadOnlyList<RecetaDto>> ListarAsync(
        PrescriptionStatus? estado, bool soloVencidas, CancellationToken ct)
    {
        var (productorId, tecnicoId) = await AlcanceAsync(ct);
        var hoy = Fechas.Hoy;

        Expression<Func<Prescription, bool>> condicion = r =>
            (productorId == null || r.Visita!.Solicitud!.Finca!.ProductorId == productorId) &&
            (tecnicoId == null || r.Visita!.TecnicoId == tecnicoId) &&
            (estado == null || r.Estado == estado) &&
            (!soloVencidas || (r.Estado == PrescriptionStatus.Pendiente && r.FechaAplicacion < hoy));

        var lista = await recetas.ListAsync(
            condicion,
            q => q.OrderBy(r => r.FechaAplicacion).ThenBy(r => r.Id),
            tomar: 200,
            incluir: RecetaMapeos.Relaciones,
            ct: ct);

        return lista.Select(r => r.ADto()).ToList();
    }

    public async Task<RecetaDto> SeguimientoAsync(int id, SeguimientoRecetaDto dto, CancellationToken ct)
    {
        await seguimientoValidator.ValidateAndThrowAsync(dto, ct);

        var receta = await recetas.FirstAsync(r => r.Id == id, ct: ct)
            ?? throw new NotFoundException("La receta no existe.");

        await actor.VisitaAsync(receta.VisitaId, true, ct);

        if (dto.Estado == PrescriptionStatus.Aplicada && dto.FechaAplicacionReal < DateOnly.FromDateTime(receta.FechaCreacion))
        {
            throw Errores.Campo(
                nameof(dto.FechaAplicacionReal),
                "La fecha de aplicación no puede ser anterior a la emisión de la receta.");
        }

        receta.Estado = dto.Estado!.Value;
        receta.FechaAplicacionReal = dto.Estado == PrescriptionStatus.Aplicada ? dto.FechaAplicacionReal : null;
        receta.ComentarioSeguimiento = Limpiar(dto.Comentario);
        receta.FechaRegistroSeguimiento = Fechas.Ahora;
        receta.UsuarioSeguimientoId = actor.UsuarioId;

        await unitOfWork.SaveChangesAsync(ct);

        return await ObtenerDtoAsync(receta.Id, ct);
    }

    public async Task EliminarAsync(int id, CancellationToken ct)
    {
        var receta = await recetas.FirstAsync(r => r.Id == id, ct: ct)
            ?? throw new NotFoundException("La receta no existe.");

        var visita = await actor.VisitaAsync(receta.VisitaId, true, ct);

        if (visita.Estado != VisitStatus.EnProceso || receta.Estado != PrescriptionStatus.Pendiente)
        {
            throw new ConflictException(
                "Solo se elimina una receta pendiente mientras la visita está en proceso.");
        }

        recetas.Remove(receta);
        await unitOfWork.SaveChangesAsync(ct);
    }

    private async Task<RecetaDto> ObtenerDtoAsync(int id, CancellationToken ct)
    {
        var receta = await recetas.FirstAsync(r => r.Id == id, RecetaMapeos.Relaciones, ct: ct);

        return receta!.ADto();
    }

    private async Task<(int? ProductorId, int? TecnicoId)> AlcanceAsync(CancellationToken ct)
    {
        if (actor.EsProductor)
        {
            return ((await actor.ProductorAsync(ct)).Id, null);
        }

        if (actor.EsTecnico)
        {
            return (null, (await actor.TecnicoAsync(ct)).Id);
        }

        return (null, null);
    }

    private static string? Limpiar(string? texto) =>
        string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();
}
