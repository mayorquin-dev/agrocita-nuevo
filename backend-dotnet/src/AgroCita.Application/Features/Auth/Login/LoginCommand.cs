
namespace AgroCita.Application.Features.Auth.Login;

public record LoginCommand(
    string Email,
    string Password
);
