using AgroCita.Application.Features.Evidencias;

namespace AgroCita.UnitTests.Features.Evidencias;

public class SubirEvidenciaValidatorTests
{
    private readonly SubirEvidenciaValidator _validator = new();

    private static SubirEvidenciaDto Foto(int? cultivoId) => new(
        new MemoryStream([1, 2, 3]), "image/jpeg", 3, cultivoId, null, null, null, null, null);

    [Fact]
    public void RechazaLaFotoSinCultivo()
    {
        var resultado = _validator.Validate(Foto(null));

        var error = Assert.Single(resultado.Errors);
        Assert.Equal(nameof(SubirEvidenciaDto.CultivoId), error.PropertyName);
        Assert.Equal("Elija el cultivo que muestra la foto.", error.ErrorMessage);
    }

    [Fact]
    public void AceptaLaFotoConCultivo()
    {
        Assert.True(_validator.Validate(Foto(4)).IsValid);
    }
}
