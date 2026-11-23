using AgroCita.Domain.Entities;

namespace AgroCita.UnitTests.Domain;

public class VisitTransicionesTests
{
    [Theory]
    [InlineData(VisitStatus.Pendiente, VisitStatus.Confirmada)]
    [InlineData(VisitStatus.Confirmada, VisitStatus.EnProceso)]
    [InlineData(VisitStatus.EnProceso, VisitStatus.Completada)]
    [InlineData(VisitStatus.Pendiente, VisitStatus.Cancelada)]
    [InlineData(VisitStatus.Confirmada, VisitStatus.Cancelada)]
    [InlineData(VisitStatus.EnProceso, VisitStatus.Cancelada)]
    public void TransicionValida_PermiteAvanzarOCancelar(VisitStatus actual, VisitStatus nuevo)
    {
        Assert.True(Visit.TransicionValida(actual, nuevo));
    }

    [Theory]
    [InlineData(VisitStatus.EnProceso, VisitStatus.Confirmada)]
    [InlineData(VisitStatus.EnProceso, VisitStatus.Pendiente)]
    [InlineData(VisitStatus.Confirmada, VisitStatus.Pendiente)]
    [InlineData(VisitStatus.Pendiente, VisitStatus.EnProceso)]
    [InlineData(VisitStatus.Pendiente, VisitStatus.Completada)]
    [InlineData(VisitStatus.Confirmada, VisitStatus.Completada)]
    [InlineData(VisitStatus.Completada, VisitStatus.EnProceso)]
    [InlineData(VisitStatus.Completada, VisitStatus.Cancelada)]
    [InlineData(VisitStatus.Cancelada, VisitStatus.Pendiente)]
    [InlineData(VisitStatus.Confirmada, VisitStatus.Confirmada)]
    public void TransicionValida_RechazaRetrocesosSaltosYCerradas(VisitStatus actual, VisitStatus nuevo)
    {
        Assert.False(Visit.TransicionValida(actual, nuevo));
    }

    [Fact]
    public void PuedePasarA_UsaElEstadoActual()
    {
        var visita = new Visit { Estado = VisitStatus.EnProceso };

        Assert.True(visita.PuedePasarA(VisitStatus.Completada));
        Assert.False(visita.PuedePasarA(VisitStatus.Confirmada));
    }
}
