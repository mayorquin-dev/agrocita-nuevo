using AgroCita.Application.Common.Exceptions;
using AgroCita.Application.Common.Interfaces;
using AgroCita.Application.Common.Models;
using AgroCita.Application.Common.Services;
using AgroCita.Domain.Entities;
using FluentValidation;

namespace AgroCita.Application.Features.Evidencias;

public class EvidenciasHandler(
    ActorActual actor,
    IRepository<VisitEvidence> evidencias,
    IFileStorage almacenamiento,
    IUnitOfWork unitOfWork,
    IValidator<SubirEvidenciaDto> validator)
{
    public async Task<EvidenciaDto> SubirAsync(int visitaId, SubirEvidenciaDto dto, CancellationToken ct)
    {
        await validator.ValidateAndThrowAsync(dto, ct);

        var visita = await actor.VisitaAsync(visitaId, true, ct, "Solicitud.Cultivos");
        ExigirEnCampo(visita);

        if (dto.CultivoId is int cultivoId &&
            visita.Solicitud!.Cultivos.All(c => c.CultivoId != cultivoId))
        {
            throw Errores.Campo(nameof(dto.CultivoId), "El cultivo no pertenece a esta visita.");
        }

        if (await evidencias.CountAsync(e => e.VisitaId == visitaId, ct: ct) >= LimitesEvidencia.MaximoPorVisita)
        {
            throw new ConflictException(
                $"La visita ya tiene el máximo de {LimitesEvidencia.MaximoPorVisita} evidencias.");
        }

        var extension = LimitesEvidencia.Tipos[dto.ContentType!];
        var clave = await almacenamiento.GuardarAsync(dto.Contenido!, "evidencias", extension, ct);

        var evidencia = new VisitEvidence
        {
            VisitaId = visita.Id,
            CultivoId = dto.CultivoId,
            UsuarioId = actor.UsuarioId,
            Descripcion = string.IsNullOrWhiteSpace(dto.Descripcion) ? null : dto.Descripcion.Trim(),
            Archivo = clave,
            ContentType = dto.ContentType!,
            TamanoBytes = dto.Tamano,
            Latitud = dto.Latitud,
            Longitud = dto.Longitud,
            PrecisionMetros = dto.PrecisionMetros,
            FechaCaptura = dto.FechaCaptura?.AUtc() ?? Fechas.Ahora,
            FechaRegistro = Fechas.Ahora
        };

        evidencias.Add(evidencia);

        try
        {
            await unitOfWork.SaveChangesAsync(ct);
        }
        catch
        {
            almacenamiento.Eliminar(clave);
            throw;
        }

        var guardada = await evidencias.FirstAsync(e => e.Id == evidencia.Id, EvidenciaMapeos.Relaciones, ct: ct);

        return guardada!.ADto();
    }

    public async Task<IReadOnlyList<EvidenciaDto>> ListarAsync(int visitaId, CancellationToken ct)
    {
        await actor.VisitaAsync(visitaId, false, ct);

        var lista = await evidencias.ListAsync(
            e => e.VisitaId == visitaId,
            q => q.OrderBy(e => e.FechaCaptura),
            incluir: EvidenciaMapeos.Relaciones,
            ct: ct);

        return lista.Select(e => e.ADto()).ToList();
    }

    public async Task<ArchivoDto> ArchivoAsync(int id, CancellationToken ct)
    {
        var evidencia = await evidencias.FirstAsync(e => e.Id == id, ct: ct)
            ?? throw new NotFoundException("La evidencia no existe.");

        await actor.VisitaAsync(evidencia.VisitaId, false, ct);

        var contenido = almacenamiento.Abrir(evidencia.Archivo)
            ?? throw new NotFoundException("El archivo de la evidencia ya no está disponible.");

        return new ArchivoDto(
            contenido,
            evidencia.ContentType,
            $"evidencia-{evidencia.Id}.{LimitesEvidencia.Tipos.GetValueOrDefault(evidencia.ContentType, "bin")}");
    }

    public async Task EliminarAsync(int id, CancellationToken ct)
    {
        var evidencia = await evidencias.FirstAsync(e => e.Id == id, ct: ct)
            ?? throw new NotFoundException("La evidencia no existe.");

        var visita = await actor.VisitaAsync(evidencia.VisitaId, true, ct);
        ExigirEnCampo(visita);

        evidencias.Remove(evidencia);
        await unitOfWork.SaveChangesAsync(ct);

        almacenamiento.Eliminar(evidencia.Archivo);
    }

    private static void ExigirEnCampo(Visit visita)
    {
        if (visita.Estado != VisitStatus.EnProceso)
        {
            throw new ConflictException(
                "Las evidencias solo se registran mientras la visita está en proceso.");
        }
    }
}
