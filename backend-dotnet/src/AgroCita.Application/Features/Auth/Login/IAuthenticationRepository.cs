
namespace AgroCita.Application.Features.Auth.Login;

public interface IAuthenticationRepository
{
    Task<AuthenticationUser?> GetByEmailAsync(
        string email,
        CancellationToken cancellationToken = default
    );
}
