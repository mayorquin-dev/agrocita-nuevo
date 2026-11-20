
using AgroCita.Infrastructure.Services.Security;

namespace AgroCita.UnitTests.Services.Security;

public class PasswordHashServiceTests
{
    private readonly PasswordHashService _passwordHashService;

    public PasswordHashServiceTests()
    {
        _passwordHashService = new PasswordHashService();
    }

    [Fact]
    public void HashPassword_ShouldReturnHashedPassword()
    {
        var password = "AgroCita_Test_123";

        var hashedPassword =
            _passwordHashService.HashPassword(password);

        Assert.NotNull(hashedPassword);
        Assert.NotEmpty(hashedPassword);
        Assert.NotEqual(password, hashedPassword);
    }

    [Fact]
    public void HashPassword_ShouldGenerateDifferentHashesForSamePassword()
    {
        var password = "AgroCita_Test_123";

        var firstHash = _passwordHashService.HashPassword(password);
        var secondHash = _passwordHashService.HashPassword(password);

        Assert.NotEqual(firstHash, secondHash);
    }

    [Fact]
    public void VerifyPassword_ShouldReturnTrue_WhenPasswordIsCorrect()
    {
        var password = "AgroCita_Test_123";
        var hashedPassword =
            _passwordHashService.HashPassword(password);

        var result = _passwordHashService.VerifyPassword(
            hashedPassword,
            password);

        Assert.True(result);
    }

    [Fact]
    public void VerifyPassword_ShouldReturnFalse_WhenPasswordIsIncorrect()
    {
        var password = "AgroCita_Test_123";
        var incorrectPassword = "Password_Incorrecta";

        var hashedPassword =
            _passwordHashService.HashPassword(password);

        var result = _passwordHashService.VerifyPassword(
            hashedPassword,
            incorrectPassword);

        Assert.False(result);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void HashPassword_ShouldThrow_WhenPasswordIsEmpty(string password)
    {
        var exception = Assert.Throws<ArgumentException>(
            () => _passwordHashService.HashPassword(password));

        Assert.Equal("password", exception.ParamName);
    }

    [Fact]
    public void VerifyPassword_ShouldReturnFalse_WhenHashIsEmpty()
    {
        var password = "AgroCita_Test_123";

        var result = _passwordHashService.VerifyPassword(
            string.Empty,
            password);

        Assert.False(result);
    }

    [Fact]
    public void VerifyPassword_ShouldReturnFalse_WhenProvidedPasswordIsEmpty()
    {
        var password = "AgroCita_Test_123";
        var hashedPassword =
            _passwordHashService.HashPassword(password);

        var result = _passwordHashService.VerifyPassword(
            hashedPassword,
            string.Empty);

        Assert.False(result);
    }
}
