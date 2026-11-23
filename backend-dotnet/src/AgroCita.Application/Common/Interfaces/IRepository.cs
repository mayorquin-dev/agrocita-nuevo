using System.Linq.Expressions;

namespace AgroCita.Application.Common.Interfaces;

public interface IRepository<T> where T : class
{
    Task<T?> FirstAsync(
        Expression<Func<T, bool>> filtro,
        string[]? incluir = null,
        bool sinFiltroEmpresa = false,
        CancellationToken ct = default);

    Task<List<T>> ListAsync(
        Expression<Func<T, bool>>? filtro = null,
        Func<IQueryable<T>, IQueryable<T>>? ordenar = null,
        int? saltar = null,
        int? tomar = null,
        string[]? incluir = null,
        bool sinFiltroEmpresa = false,
        CancellationToken ct = default);

    Task<int> CountAsync(
        Expression<Func<T, bool>>? filtro = null,
        bool sinFiltroEmpresa = false,
        CancellationToken ct = default);

    Task<bool> AnyAsync(
        Expression<Func<T, bool>> filtro,
        bool sinFiltroEmpresa = false,
        CancellationToken ct = default);

    void Add(T entidad);

    void Remove(T entidad);
}

public interface IFileStorage
{
    Task<string> GuardarAsync(Stream contenido, string carpeta, string extension, CancellationToken ct);

    Stream? Abrir(string clave);

    void Eliminar(string clave);
}

public record HojaExcel(
    string Nombre,
    IReadOnlyList<string> Encabezados,
    IReadOnlyList<object?[]> Filas);

public interface IExcelExporter
{
    byte[] Generar(IReadOnlyList<HojaExcel> hojas);
}

public interface IUnitOfWork
{
    Task SaveChangesAsync(CancellationToken ct = default);
}
