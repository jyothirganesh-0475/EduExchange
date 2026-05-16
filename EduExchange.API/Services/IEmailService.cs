using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
namespace EduExchange.API.Services;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string body);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        var email = new MimeMessage();
        
        // Added the '!' to tell the compiler these values will not be null
        email.From.Add(MailboxAddress.Parse(_config["EmailSettings:Email"]!));
        email.To.Add(MailboxAddress.Parse(toEmail));
        email.Subject = subject;

        var builder = new BodyBuilder { HtmlBody = body };
        email.Body = builder.ToMessageBody();

        using var smtp = new SmtpClient();
        try 
        {
            // Also added '!' here for safety from other potential warnings
            await smtp.ConnectAsync(_config["EmailSettings:Host"]!, 587, SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(_config["EmailSettings:Email"]!, _config["EmailSettings:Password"]!);
            await smtp.SendAsync(email);
        }
        finally
        {
            await smtp.DisconnectAsync(true);
        }
    }
}