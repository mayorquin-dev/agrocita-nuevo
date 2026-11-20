
namespace AgroCita.Application.Features.Auth.Login;

public record LoginResult(
    string AccessToken,
    int ExpiresInSeconds,
    UsuarioActualDto Usuario
);
