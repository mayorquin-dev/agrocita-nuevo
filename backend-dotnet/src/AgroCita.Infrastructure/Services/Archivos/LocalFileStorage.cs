using System.Text.RegularExpressions;
using AgroCita.Application.Common.Interfaces;

namespace AgroCita.Infrastructure.Services.Archivos;

public partial class LocalFileStorage : IFileStorage
{
    private readonly string _raiz;

    public LocalFileStorage(string raiz)
    {
        _raiz = Path.GetFullPath(raiz);
        Directory.CreateDirectory(_raiz);
    }

    public async Task<string> GuardarAsync(
        Stream contenido, string carpeta, string extension, CancellationToken ct)
    {
        if (!SegmentoValido().IsMatch(carpeta) || !SegmentoValido().IsMatch(extension))
        {
            throw new ArgumentException("La carpeta o la extensión no son válidas.");
        }

        var clave = $"{carpeta}/{DateTime.UtcNow:yyyy/MM}/{Guid.NewGuid():N}.{extension}";
        var ruta = RutaSegura(clave);

        Directory.CreateDirectory(Path.GetDirectoryName(ruta)!);

        await using var destino = new FileStream(ruta, FileMode.CreateNew, FileAccess.Write);
        await contenido.CopyToAsync(destino, ct);

        return clave;
    }

    public Stream? Abrir(string clave)
    {
        var ruta = RutaSegura(clave);

        return File.Exists(ruta)
            ? new FileStream(ruta, FileMode.Open, FileAccess.Read, FileShare.Read)
            : null;
    }

    public void Eliminar(string clave)
    {
        var ruta = RutaSegura(clave);

        if (File.Exists(ruta))
        {
            File.Delete(ruta);
        }
    }

    private string RutaSegura(string clave)
    {
        if (!ClaveValida().IsMatch(clave))
        {
            throw new ArgumentException("La clave del archivo no es válida.");
        }

        var ruta = Path.GetFullPath(Path.Combine(_raiz, clave));

        if (!ruta.StartsWith(_raiz + Path.DirectorySeparatorChar, StringComparison.Ordinal))
        {
            throw new ArgumentException("La clave del archivo no es válida.");
        }

        return ruta;
    }

    [GeneratedRegex("^[a-z0-9]{1,20}$")]
    private static partial Regex SegmentoValido();

    [GeneratedRegex(@"^[a-z0-9]{1,20}/\d{4}/\d{2}/[a-f0-9]{32}\.[a-z0-9]{1,20}$")]
    private static partial Regex ClaveValida();
}
