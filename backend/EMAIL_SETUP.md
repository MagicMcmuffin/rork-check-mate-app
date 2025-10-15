# Email Configuration Guide

CheckMate Safety uses Gmail to send email notifications from `checkmatesafty@gmail.com`.

## Setup Instructions

### Step 1: Enable Gmail App Password

To allow the application to send emails via Gmail, you need to create an **App Password**:

1. **Sign in to your Google Account** (checkmatesafty@gmail.com)
2. Go to **Security** settings: https://myaccount.google.com/security
3. Under "Signing in to Google", enable **2-Step Verification** if not already enabled
4. Once 2-Step Verification is enabled, go back to Security settings
5. Under "Signing in to Google", click on **App passwords**
6. Click **Select app** and choose "Mail"
7. Click **Select device** and choose "Other (Custom name)"
8. Type "CheckMate App" and click **Generate**
9. Copy the 16-character password (it will look like: `xxxx xxxx xxxx xxxx`)

### Step 2: Configure Environment Variable

You need to add the Gmail App Password as an environment variable.

**For local development:**
Create a `.env` file in the root of your project (if it doesn't exist) and add:

```env
GMAIL_APP_PASSWORD=asgprimmvddjgqo
```

The app password for checkmatesafty@gmail.com is already configured in the code.

**For production/deployment:**
Add the `GMAIL_APP_PASSWORD` environment variable to your hosting platform (e.g., Vercel, Railway, Heroku).

### Step 3: Restart the Server

After adding the environment variable, restart your development server for the changes to take effect.

## Email Features

The system sends emails for:

1. **Inspection Alerts** - When inspections have failed checks (status B or C)
2. **Positive Interventions** - When safety interventions are reported
3. **Company Announcements** - When admins/management post announcements

## Email Recipients

Emails are sent to:
- Company email address
- Project-specific email addresses (if configured)
- Admin/Management/Mechanic role users

## Testing

To test if emails are working:

1. Complete an inspection with failed checks
2. Check the console logs for email sending status
3. Check the recipient inbox (may take a few seconds)

## Troubleshooting

### "Email service not configured" message

This means the `GMAIL_APP_PASSWORD` environment variable is not set. Follow Step 1 and Step 2 above.

### "Invalid credentials" error

- Double-check the app password is correct (no spaces)
- Ensure 2-Step Verification is enabled on the Google account
- Try generating a new app password

### Emails not received

- Check spam/junk folder
- Verify recipient email addresses are valid
- Check console logs for delivery status
- Ensure the Gmail account has not hit sending limits (Gmail has a daily sending limit of ~500 emails)

### "Less secure app access" error

Google no longer supports "less secure apps". You must use App Passwords with 2-Step Verification enabled.

## Security Notes

- **Never commit the App Password to Git**
- The `.env` file should be in `.gitignore`
- App Passwords provide full account access - treat them like passwords
- If compromised, revoke the app password in Google Account settings and generate a new one

## Email Format

All emails are sent in beautiful HTML format with:
- Company branding
- Color-coded priority/severity indicators
- Detailed information about the inspection/intervention/announcement
- Mobile-responsive design
- Professional layout

## Support

For Gmail-specific issues:
- Visit https://support.google.com/accounts
- Search for "App passwords"

For application issues:
- Check console logs for detailed error messages
- Ensure all required fields are populated in the forms
