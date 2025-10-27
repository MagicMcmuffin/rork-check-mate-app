import { z } from 'zod';
import { publicProcedure } from '../../../create-context.js';
import { sendEmail } from '../../../../services/email.js';
import crypto from 'crypto';

export const forgotPasswordProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (!user) {
      return { success: true, message: 'If an account exists, a reset link has been sent' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await ctx.prisma.passwordResetToken.create({
      data: {
        token,
        email: user.email,
        expiresAt,
      },
    });

    const baseUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://checkmate.app';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 24px; text-align: center;">
                <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">🔐 Password Reset</h1>
              </div>
              
              <div style="padding: 24px;">
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #1e293b;">
                  Hello ${user.name},
                </p>
                
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #64748b;">
                  We received a request to reset your password for your Check Mate account. Click the button below to reset your password:
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${resetUrl}" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Reset Password
                  </a>
                </div>
                
                <p style="margin: 20px 0 0 0; font-size: 14px; color: #64748b;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="margin: 8px 0 20px 0; font-size: 14px; color: #3b82f6; word-break: break-all;">
                  ${resetUrl}
                </p>
                
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-top: 24px;">
                  <p style="margin: 0; color: #78350f; font-size: 14px;">
                    <strong>Security Note:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                  </p>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
              <p style="margin: 0;">This is an automated message from CheckMate Safety</p>
              <p style="margin: 4px 0 0 0;">checkmatesafty@gmail.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail({
      to: [user.email],
      subject: 'Reset Your Password - Check Mate',
      html: emailHtml,
    });

    return { 
      success: true, 
      message: 'If an account exists, a reset link has been sent' 
    };
  });

export default forgotPasswordProcedure;
