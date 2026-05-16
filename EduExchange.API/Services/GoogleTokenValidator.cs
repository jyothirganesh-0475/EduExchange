using Google.Apis.Auth;

namespace EduExchange.API.Services;

public interface IGoogleTokenValidator
{
    Task<GoogleJsonWebSignature.Payload?> ValidateAsync(string idToken);
}

public class GoogleTokenValidator : IGoogleTokenValidator
{
    private readonly IConfiguration _config;

    public GoogleTokenValidator(IConfiguration config)
    {
        _config = config;
    }

    public async Task<GoogleJsonWebSignature.Payload?> ValidateAsync(string idToken)
    {
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _config["Google:ClientId"] }
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
            return payload;
        }
        catch
        {
            return null; // Invalid token
        }
    }
}