using System.Globalization;
using AgroCita.Application.Features.Informes;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace AgroCita.Infrastructure.Services.Archivos;

public class QuestInformePdfGenerator : IInformePdfGenerator
{
    private static readonly CultureInfo Cultura = CultureInfo.GetCultureInfo("es-HN");
    private static readonly TimeSpan Desfase = TimeSpan.FromHours(-6);

    private const string Bosque = "#0F2A1D";
    private const string Musgo = "#4C8A5C";
    private const string Lima = "#C5F05A";
    private const string Linea = "#DFDED4";
    private const string Papel = "#F5F4EE";
    private const string Tenue = "#5B665F";

    static QuestInformePdfGenerator()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] Generar(InformePdfModelo m) =>
        Document.Create(documento =>
        {
            documento.Page(pagina =>
            {
                pagina.Size(PageSizes.Letter);
                pagina.Margin(36);
                pagina.DefaultTextStyle(t => t.FontSize(9.5f).FontColor("#0D1B14"));

                pagina.Header().Element(c => Encabezado(c, m));
                pagina.Content().PaddingVertical(14).Element(c => Contenido(c, m));
                pagina.Footer().Element(c => Pie(c, m));
            });
        }).GeneratePdf();

    private static void Encabezado(IContainer contenedor, InformePdfModelo m)
    {
        contenedor.Column(columna =>
        {
            columna.Item().Row(fila =>
            {
                if (m.Empresa.Logo is { Length: > 0 } logo)
                {
                    fila.ConstantItem(64).Height(48).AlignMiddle().Image(logo).FitArea();
                    fila.ConstantItem(12);
                }

                fila.RelativeItem().Column(c =>
                {
                    c.Item().Text(m.Empresa.Nombre).FontSize(15).Bold().FontColor(Bosque);
                    c.Item().Text($"RTN {m.Empresa.Rtn} · Tel. {m.Empresa.Telefono} · {m.Empresa.Email}").FontSize(8.5f).FontColor(Tenue);

                    if (!string.IsNullOrWhiteSpace(m.Empresa.Direccion))
                    {
                        c.Item().Text(m.Empresa.Direccion).FontSize(8.5f).FontColor(Tenue);
                    }
                });

                fila.ConstantItem(150).AlignRight().Column(c =>
                {
                    c.Item().AlignRight().Text("INFORME DE VISITA TÉCNICA").FontSize(8).Bold().LetterSpacing(0.08f).FontColor(Musgo);
                    c.Item().AlignRight().Text($"V-{m.VisitaId:0000}").FontSize(18).Bold().FontColor(Bosque);
                    c.Item().AlignRight().Text(Fecha(m.FechaVisita)).FontSize(8.5f).FontColor(Tenue);
                });
            });

            columna.Item().PaddingTop(10).Height(3).Background(Lima);
        });
    }

    private static void Contenido(IContainer contenedor, InformePdfModelo m)
    {
        contenedor.Column(columna =>
        {
            columna.Spacing(14);

            columna.Item().Background(Papel).Border(1).BorderColor(Linea).Padding(10).Table(tabla =>
            {
                tabla.ColumnsDefinition(c =>
                {
                    c.RelativeColumn();
                    c.RelativeColumn();
                    c.RelativeColumn();
                });

                Dato(tabla.Cell(), "Productor", m.Productor);
                Dato(tabla.Cell(), "Finca", m.Finca);
                Dato(tabla.Cell(), "Técnico", m.Tecnico);
                Dato(tabla.Cell().ColumnSpan(2), "Ubicación", m.Ubicacion);
                Dato(tabla.Cell(), "Cultivos atendidos", string.Join(", ", m.Cultivos));
            });

            columna.Item().Element(c => Seccion(c, "Motivo de la solicitud", m.Motivo));
            columna.Item().Element(c => Seccion(c, "Observaciones", m.Observaciones));
            columna.Item().Element(c => Seccion(c, "Diagnóstico", m.Diagnostico));
            columna.Item().Element(c => Seccion(c, "Recomendaciones", m.Recomendaciones));

            if (m.Inspecciones.Count > 0)
            {
                columna.Item().Column(c =>
                {
                    Titulo(c.Item(), "Inspecciones de calidad");

                    foreach (var inspeccion in m.Inspecciones)
                    {
                        c.Item().PaddingTop(4).Text(texto =>
                        {
                            texto.Span(inspeccion.Cultivo).Bold();
                            if (inspeccion.Categoria is not null) texto.Span($" · {inspeccion.Categoria}").FontColor(Musgo);
                        });

                        if (inspeccion.Resultados.Count > 0)
                        {
                            c.Item().Text(string.Join("   ", inspeccion.Resultados.Select(r => $"{r.Parametro}: {r.Valor}"))).FontColor(Tenue);
                        }

                        if (!string.IsNullOrWhiteSpace(inspeccion.Observaciones))
                        {
                            c.Item().Text(inspeccion.Observaciones).FontColor(Tenue);
                        }
                    }
                });
            }

            if (m.Recetas.Count > 0)
            {
                columna.Item().Column(c =>
                {
                    Titulo(c.Item(), "Receta y plan de manejo");

                    c.Item().PaddingTop(4).Table(tabla =>
                    {
                        tabla.ColumnsDefinition(col =>
                        {
                            col.RelativeColumn(2.4f);
                            col.RelativeColumn(1.4f);
                            col.RelativeColumn(1.3f);
                            col.RelativeColumn(1.1f);
                            col.RelativeColumn(1.6f);
                            col.RelativeColumn(1);
                        });

                        tabla.Header(h =>
                        {
                            foreach (var titulo in new[] { "Producto", "Dosis", "Método", "Aplicar el", "Cultivo", "Estado" })
                            {
                                h.Cell().Background(Bosque).Padding(5).Text(titulo).FontSize(8).Bold().FontColor(Colors.White);
                            }
                        });

                        foreach (var r in m.Recetas)
                        {
                            Celda(tabla.Cell(), c2 =>
                            {
                                c2.Item().Text(r.Producto).Bold();
                                c2.Item().Text(r.Tipo).FontSize(8).FontColor(Tenue);
                                if (!string.IsNullOrWhiteSpace(r.Indicaciones)) c2.Item().Text(r.Indicaciones).FontSize(8).Italic().FontColor(Tenue);
                            });
                            Celda(tabla.Cell(), c2 => c2.Item().Text($"{r.Dosis.ToString("0.###", Cultura)} {r.Unidad}"));
                            Celda(tabla.Cell(), c2 => c2.Item().Text(r.Metodo ?? "—"));
                            Celda(tabla.Cell(), c2 => c2.Item().Text(r.FechaAplicacion.ToString("dd/MM/yyyy", Cultura)));
                            Celda(tabla.Cell(), c2 => c2.Item().Text(r.Cultivo));
                            Celda(tabla.Cell(), c2 => c2.Item().Text(r.Estado));
                        }
                    });
                });
            }

            if (m.Fotos.Count > 0)
            {
                columna.Item().Column(c =>
                {
                    Titulo(c.Item(), "Evidencias fotográficas");

                    c.Item().PaddingTop(6).Table(tabla =>
                    {
                        tabla.ColumnsDefinition(col =>
                        {
                            col.RelativeColumn();
                            col.RelativeColumn();
                            col.RelativeColumn();
                        });

                        foreach (var foto in m.Fotos)
                        {
                            tabla.Cell().Padding(4).Column(f =>
                            {
                                f.Item().Height(130).Background(Papel).AlignCenter().AlignMiddle().Image(foto.Imagen).FitArea();
                                f.Item().PaddingTop(3).Text(foto.Descripcion ?? foto.Cultivo ?? "Foto de campo").FontSize(8).Bold();
                                f.Item().Text(
                                        $"{FechaHora(foto.Fecha)}" +
                                        (foto.Latitud is null ? " · sin GPS" : $" · {Coordenadas(foto.Latitud, foto.Longitud)}"))
                                    .FontSize(7.5f).FontColor(Tenue);
                            });
                        }
                    });

                    if (m.FotosOmitidas > 0)
                    {
                        c.Item().Text($"Se omitieron {m.FotosOmitidas} foto(s) adicionales; están disponibles en AgroCita.").FontSize(8).FontColor(Tenue);
                    }
                });
            }

            columna.Item().ShowEntire().Column(c =>
            {
                Titulo(c.Item(), "Conformidad del productor");

                if (m.Firma is null)
                {
                    c.Item().PaddingTop(4).Text("La visita aún no ha sido cerrada con la firma del productor.").FontColor(Tenue);
                    return;
                }

                c.Item().PaddingTop(6).Row(fila =>
                {
                    fila.ConstantItem(220).Height(90).Border(1).BorderColor(Linea).Background(Colors.White).Padding(4).Image(m.Firma.Imagen).FitArea();
                    fila.ConstantItem(16);
                    fila.RelativeItem().AlignBottom().Column(d =>
                    {
                        d.Item().Text(m.Firma.FirmadoPor).Bold();
                        d.Item().Text($"Firmó el {FechaHora(m.Firma.Fecha)}").FontColor(Tenue);
                        d.Item().Text(m.Firma.Latitud is null ? "Sin ubicación GPS" : $"GPS {Coordenadas(m.Firma.Latitud, m.Firma.Longitud)}").FontColor(Tenue);
                        if (m.FechaSeguimiento is DateOnly seguimiento)
                        {
                            d.Item().PaddingTop(4).Text($"Próxima visita de seguimiento: {seguimiento.ToString("dd 'de' MMMM 'de' yyyy", Cultura)}").Bold().FontColor(Musgo);
                        }
                    });
                });
            });
        });
    }

    private static void Pie(IContainer contenedor, InformePdfModelo m)
    {
        contenedor.BorderTop(1).BorderColor(Linea).PaddingTop(6).Row(fila =>
        {
            fila.RelativeItem().Text($"Generado con AgroCita el {FechaHora(m.Generado)} · Informe elaborado el {FechaHora(m.FechaInforme)}")
                .FontSize(7.5f).FontColor(Tenue);
            fila.ConstantItem(80).AlignRight().Text(t =>
            {
                t.DefaultTextStyle(s => s.FontSize(7.5f).FontColor(Tenue));
                t.Span("Página ");
                t.CurrentPageNumber();
                t.Span(" de ");
                t.TotalPages();
            });
        });
    }

    private static void Titulo(IContainer contenedor, string texto) =>
        contenedor.BorderBottom(1).BorderColor(Linea).PaddingBottom(3).Text(texto.ToUpper(Cultura)).FontSize(8.5f).Bold().LetterSpacing(0.06f).FontColor(Musgo);

    private static void Seccion(IContainer contenedor, string titulo, string texto) =>
        contenedor.Column(c =>
        {
            Titulo(c.Item(), titulo);
            c.Item().PaddingTop(4).Text(texto).LineHeight(1.35f);
        });

    private static void Dato(IContainer contenedor, string etiqueta, string valor) =>
        contenedor.Padding(4).Column(c =>
        {
            c.Item().Text(etiqueta.ToUpper(Cultura)).FontSize(7).Bold().LetterSpacing(0.06f).FontColor(Tenue);
            c.Item().Text(string.IsNullOrWhiteSpace(valor) ? "—" : valor);
        });

    private static void Celda(IContainer contenedor, Action<ColumnDescriptor> contenido) =>
        contenedor.BorderBottom(1).BorderColor(Linea).Padding(5).Column(contenido);

    private static string Fecha(DateTime utc) =>
        (utc + Desfase).ToString("dddd d 'de' MMMM 'de' yyyy", Cultura);

    private static string FechaHora(DateTime utc) =>
        (utc + Desfase).ToString("dd/MM/yyyy h:mm tt", Cultura);

    private static string Coordenadas(double? latitud, double? longitud) =>
        string.Create(CultureInfo.InvariantCulture, $"{latitud:0.00000}, {longitud:0.00000}");
}
