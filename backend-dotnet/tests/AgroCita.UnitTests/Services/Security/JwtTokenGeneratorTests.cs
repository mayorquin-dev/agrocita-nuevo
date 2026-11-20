
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AgroCita.Infrastructure.Services.Security;
using Microsoft.Extensions.Options;
using Xunit;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace AgroCita.UnitTests.Services.Security;

public class JwtTokenGeneratorTests
{
    private readonly JwtTokenGenerator _generator;
    private readonly JwtSettings _settings;

    public JwtTokenGeneratorTests()
    {
            _settings = new JwtSettings
            {
                SecretKey = Convert.ToBase64String(
                    System.Security.Cryptography.RandomNumberGenerator.GetBytes(64)),
                Issuer = "AgroCita",
                Audience = "AgroCitaUsers",
                ExpirationMinutes = 60
            };

            _generator = new JwtTokenGenerator(
                Options.Create(_settings));
    }

    [Fact]
    public void GenerateToken_ShouldIncludeUserClaims()
    {
        const int userId = 15;
        const string email = "usuario@agrocita.com";
        const string role = "PRODUCTOR";
        const int companyId = 3;

        var tokenString = _generator.GenerateToken(
            userId, email, role, companyId);

        var handler = new JwtSecurityTokenHandler();
        var token = handler.ReadJwtToken(tokenString);

        Assert.Equal(userId.ToString(),
            token.Claims.First(c => c.Type == JwtClaims.UsuarioId).Value);

        Assert.Equal(email,
            token.Claims.First(c => c.Type == JwtClaims.Email).Value);

        Assert.Equal(role,
            token.Claims.First(c => c.Type == JwtClaims.Rol).Value);

        Assert.Equal(companyId.ToString(),
            token.Claims.First(c => c.Type == JwtClaims.EmpresaId).Value);
    }

    [Fact]
    public void GenerateToken_WithoutCompany_ShouldNotIncludeCompanyId()
    {
        var tokenString = _generator.GenerateToken(
            15,
            "admin@agrocita.com",
            "ADMINISTRADOR",
            null);

        var handler = new JwtSecurityTokenHandler();
        var token = handler.ReadJwtToken(tokenString);

        Assert.DoesNotContain(
            token.Claims,
            claim => claim.Type == JwtClaims.EmpresaId);
    }

    [Fact]
    public void GenerateToken_ShouldHaveCorrectIssuerAndAudience()
    {
        var tokenString = _generator.GenerateToken(
            15,
            "usuario@agrocita.com",
            "PRODUCTOR",
            3);

        var handler = new JwtSecurityTokenHandler();
        var token = handler.ReadJwtToken(tokenString);

        Assert.Equal("AgroCita", token.Issuer);

        Assert.Contains(
            "AgroCitaUsers",
            token.Audiences);
    }

    [Fact]
    public void GenerateToken_ShouldExpireInConfiguredTime()
    {
        var beforeGeneration = DateTime.UtcNow;

        var tokenString = _generator.GenerateToken(
            15,
            "usuario@agrocita.com",
            "PRODUCTOR",
            3);

        var afterGeneration = DateTime.UtcNow;

        var handler = new JwtSecurityTokenHandler();
        var token = handler.ReadJwtToken(tokenString);

        var expectedMinimum = beforeGeneration.AddMinutes(60);
        var expectedMaximum = afterGeneration.AddMinutes(60);

        Assert.InRange(
            token.ValidTo,
            expectedMinimum.AddSeconds(-1),
            expectedMaximum.AddSeconds(1));
    }

    [Fact]
    public void GenerateToken_ShouldHaveValidSignature()
    {
        var tokenString = _generator.GenerateToken(
            15,
            "usuario@agrocita.com",
            "PRODUCTOR",
            3);

        var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };

        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = _settings.Issuer,

            ValidateAudience = true,
            ValidAudience = _settings.Audience,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_settings.SecretKey)),

            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        var principal = handler.ValidateToken(
            tokenString,
            validationParameters,
            out var validatedToken);

        Assert.NotNull(principal);
        Assert.IsType<JwtSecurityToken>(validatedToken);
        Assert.Equal(
            "15",
            principal.FindFirst(JwtClaims.UsuarioId)?.Value);
    }
}
