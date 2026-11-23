using AgroCita.Application.Common.Interfaces;
using ClosedXML.Excel;

namespace AgroCita.Infrastructure.Services.Archivos;

public class ClosedXmlExcelExporter : IExcelExporter
{
    public byte[] Generar(IReadOnlyList<HojaExcel> hojas)
    {
        using var libro = new XLWorkbook();

        foreach (var hoja in hojas)
        {
            var nombre = hoja.Nombre.Length > 31 ? hoja.Nombre[..31] : hoja.Nombre;
            var ws = libro.Worksheets.Add(nombre);

            for (var columna = 0; columna < hoja.Encabezados.Count; columna++)
            {
                ws.Cell(1, columna + 1).Value = hoja.Encabezados[columna];
            }

            for (var fila = 0; fila < hoja.Filas.Count; fila++)
            {
                var valores = hoja.Filas[fila];

                for (var columna = 0; columna < valores.Length; columna++)
                {
                    ws.Cell(fila + 2, columna + 1).Value = AValor(valores[columna]);
                }
            }

            var encabezado = ws.Range(1, 1, 1, Math.Max(1, hoja.Encabezados.Count));
            encabezado.Style.Font.Bold = true;
            encabezado.Style.Font.FontColor = XLColor.White;
            encabezado.Style.Fill.BackgroundColor = XLColor.FromHtml("#0F2A1D");

            if (hoja.Filas.Count > 0 && hoja.Encabezados.Count > 0)
            {
                ws.Range(1, 1, hoja.Filas.Count + 1, hoja.Encabezados.Count).SetAutoFilter();
            }

            ws.SheetView.FreezeRows(1);
            ws.Columns().AdjustToContents(1, Math.Min(hoja.Filas.Count + 1, 200), 8, 60);
        }

        using var salida = new MemoryStream();
        libro.SaveAs(salida);

        return salida.ToArray();
    }

    private static XLCellValue AValor(object? valor) => valor switch
    {
        null => Blank.Value,
        string texto => texto,
        int entero => entero,
        long largo => largo,
        decimal dec => dec,
        double doble => doble,
        bool booleano => booleano ? "Sí" : "No",
        DateTime fecha => fecha,
        DateOnly dia => dia.ToDateTime(TimeOnly.MinValue),
        _ => valor.ToString() ?? string.Empty
    };
}
