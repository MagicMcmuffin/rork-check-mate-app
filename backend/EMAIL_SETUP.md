# Email Notification Setup Guide

This guide explains how to configure email notifications for the CheckMate inspection system.

## Overview

The app now automatically sends email notifications when:
- Inspections are submitted with failed checks (status B or C)
- Positive interventions are reported
- Issues requiring attention are identified

## Email Recipients

Emails are sent to:
1. **Company email** - The main email associated with the company
2. **Project emails** - If the inspection/intervention is linked to a project with configured emails
3. **Admin/Management emails** - Users with roles: Administrator, Management, or Mechanic

## Setup Options

### Option 1: Using Resend (Recommended)

[Resend](https://resend.com) is a modern email API that's easy to set up and has a generous free tier.

1. Sign up for a free account at https://resend.com
2. Get your API key from the Resend dashboard
3. Add environment variables to your project:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM="CheckMate <noreply@yourdomain.com>"
```

**Note:** For production, you'll need to verify your domain in Resend. For development/testing, you can use their sandbox domain.

### Option 2: Using Nodemailer (Alternative)

If you prefer to use SMTP (Gmail, SendGrid, etc.), you can modify `backend/services/email.ts`:

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: to.join(', '),
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, message: 'Email service error' };
  }
}
```

## Environment Variables

Create or update your `.env` file with:

```env
# Email Configuration
RESEND_API_KEY=your_api_key_here
EMAIL_FROM="CheckMate <noreply@yourdomain.com>"

# Or for Nodemailer/SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="CheckMate <your-email@gmail.com>"
```

## Testing

If `RESEND_API_KEY` is not configured, the system will:
- Log email details to the console
- Continue working without actually sending emails
- Show which recipients would receive the email

This allows you to test the app without setting up email services immediately.

## Email Templates

The system includes two pre-designed HTML email templates:

### 1. Inspection Alert Email
- Sent when inspections have failed checks
- Color-coded by severity (red for critical, yellow for warnings)
- Includes:
  - Company and equipment details
  - Project information (if applicable)
  - Failed check items with status and notes
  - Additional defect notes

### 2. Positive Intervention Email
- Sent when positive interventions are reported
- Green-themed design
- Includes:
  - Employee and site information
  - Hazard description
  - Action taken
  - Severity level

## Customization

To customize email templates, edit the `generateInspectionEmailHTML()` and `generatePositiveInterventionEmailHTML()` functions in `backend/services/email.ts`.

## Troubleshooting

### Emails not sending

1. Check console logs for errors
2. Verify `RESEND_API_KEY` is set correctly
3. Ensure email addresses are valid
4. Check Resend dashboard for delivery status

### Wrong sender address

Update the `EMAIL_FROM` environment variable:
```env
EMAIL_FROM="Your Company Name <noreply@yourdomain.com>"
```

### Testing in development

Use a service like [Mailtrap](https://mailtrap.io) or Resend's test mode to catch all emails in development without sending to real addresses.

## Production Considerations

1. **Domain Verification**: Verify your domain in Resend to send from your actual domain
2. **Rate Limits**: Be aware of your email service's rate limits
3. **Email Lists**: Consider using environment-specific recipient lists for testing
4. **Monitoring**: Set up monitoring for email delivery failures
5. **GDPR/Privacy**: Ensure email notifications comply with local privacy laws

## Support

For issues with:
- **Resend**: Check their [documentation](https://resend.com/docs)
- **The app**: Check console logs for detailed error messages
