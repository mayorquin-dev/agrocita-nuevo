using AgroCita.Application.Common.Interfaces;
using AgroCita.Application.Common.Services;
using AgroCita.Domain.Entities;

namespace AgroCita.Application.Features.Busqueda;

public record ResultadoBusquedaDto(
    string Tipo,
    int Id,
    string Titulo,
    string Subtitulo,
    string Ruta,
    DateTime? Fecha = null,
    string? Estado = null);

public class BusquedaHandler(
    ActorActual actor,
    IRepository<Producer> productores,
    IRepository<Farm> fincas,
    IRepository<Visit> visitas,
    IRepository<AssistanceRequest> solicitudes)
{
    private const int PorGrupo = 6;

    public async Task<IReadOnlyList<ResultadoBusquedaDto>> BuscarAsync(string? texto, CancellationToken ct)
    {
        var q = texto?.Trim().ToLower() ?? string.Empty;

        if (q.Length < 2)
        {
            return [];
        }

        if (q.Length > 60)
        {
            q = q[..60];
        }

        int? productorId = actor.EsProductor ? (await actor.ProductorAsync(ct)).Id : null;
        int? tecnicoId = actor.EsTecnico ? (await actor.TecnicoAsync(ct)).Id : null;
        var esAdmin = productorId is null && tecnicoId is null;

        var resultados = new List<ResultadoBusquedaDto>();

        if (esAdmin)
        {
            var listaProductores = await productores.ListAsync(
                p => (p.Usuario!.Nombre + " " + p.Usuario.Apellido).ToLower().Contains(q) ||
                     p.Dni.Contains(q) ||
                     p.Telefono.Contains(q),
                o => o.OrderBy(p => p.Usuario!.Nombre),
                tomar: PorGrupo,
                incluir: ["Usuario"],
                ct: ct);

            resultados.AddRange(listaProductores.Select(p => new ResultadoBusquedaDto(
                "Productor",
                p.Id,
                p.Usuario?.NombreCompleto ?? string.Empty,
                $"DNI {p.Dni} · Tel. {p.Telefono}",
                $"/productores/{p.Id}")));
        }

        if (!actor.EsTecnico)
        {
            var listaFincas = await fincas.ListAsync(
                f => (productorId == null || f.ProductorId == productorId) &&
                     (f.Nombre.ToLower().Contains(q) ||
                      f.Municipio.ToLower().Contains(q) ||
                      f.Departamento.ToLower().Contains(q) ||
                      (f.Productor!.Usuario!.Nombre + " " + f.Productor.Usuario.Apellido).ToLower().Contains(q)),
                o => o.OrderBy(f => f.Nombre),
                tomar: PorGrupo,
                incluir: ["Productor.Usuario"],
                ct: ct);

            resultados.AddRange(listaFincas.Select(f => new ResultadoBusquedaDto(
                "Finca",
                f.Id,
                f.Nombre,
                $"{f.Municipio}, {f.Departamento}{(esAdmin ? $" · {f.Productor?.Usuario?.NombreCompleto}" : "")}",
                $"/fincas/{f.Id}")));
        }

        var numero = int.TryParse(q.TrimStart('v', 'V', '-'), out var id) ? id : (int?)null;

        var listaVisitas = await visitas.ListAsync(
            v => (productorId == null || v.Solicitud!.Finca!.ProductorId == productorId) &&
                 (tecnicoId == null || v.TecnicoId == tecnicoId) &&
                 (v.Id == numero ||
                  v.Solicitud!.Finca!.Nombre.ToLower().Contains(q) ||
                  v.Solicitud.Motivo.ToLower().Contains(q) ||
                  (v.Solicitud.Finca.Productor!.Usuario!.Nombre + " " + v.Solicitud.Finca.Productor.Usuario.Apellido)
                      .ToLower().Contains(q) ||
                  (v.Tecnico!.Usuario!.Nombre + " " + v.Tecnico.Usuario.Apellido).ToLower().Contains(q)),
            o => o.OrderByDescending(v => v.FechaProgramada),
            tomar: PorGrupo,
            incluir: ["Solicitud.Finca.Productor.Usuario", "Tecnico.Usuario"],
            ct: ct);

        resultados.AddRange(listaVisitas.Select(v => new ResultadoBusquedaDto(
            "Visita",
            v.Id,
            $"V-{v.Id:0000} · {v.Solicitud?.Finca?.Nombre}",
            actor.EsTecnico
                ? v.Solicitud?.Finca?.Productor?.Usuario?.NombreCompleto ?? string.Empty
                : v.Tecnico?.Usuario?.NombreCompleto ?? string.Empty,
            $"/visitas/{v.Id}",
            v.FechaProgramada,
            v.Estado.ToString())));

        if (!actor.EsTecnico)
        {
            var listaSolicitudes = await solicitudes.ListAsync(
                s => (productorId == null || s.Finca!.ProductorId == productorId) &&
                     (s.Id == numero ||
                      s.Motivo.ToLower().Contains(q) ||
                      s.Finca!.Nombre.ToLower().Contains(q)),
                o => o.OrderByDescending(s => s.FechaCreacion),
                tomar: PorGrupo,
                incluir: ["Finca"],
                ct: ct);

            resultados.AddRange(listaSolicitudes.Select(s => new ResultadoBusquedaDto(
                "Solicitud",
                s.Id,
                $"S-{s.Id:0000} · {s.Finca?.Nombre}",
                s.Motivo.Length > 90 ? s.Motivo[..90] + "…" : s.Motivo,
                $"/solicitudes/{s.Id}",
                s.FechaCreacion,
                s.Estado.ToString())));
        }

        return resultados;
    }
}
