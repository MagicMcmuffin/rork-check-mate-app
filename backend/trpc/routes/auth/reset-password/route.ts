import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure } from '../../../create-context.js';
import { hashPassword } from '../../../../lib/auth.js';

export const resetPasswordProcedure = publicProcedure
  .input(
    z.object({
      token: z.string(),
      password: z.string().min(6),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const resetToken = await ctx.prisma.passwordResetToken.findUnique({
      where: { token: input.token },
    });

    if (!resetToken) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid or expired reset token',
      });
    }

    if (resetToken.used) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This reset link has already been used',
      });
    }

    if (new Date() > resetToken.expiresAt) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This reset link has expired',
      });
    }

    const hashedPassword = await hashPassword(input.password);

    await ctx.prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    await ctx.prisma.passwordResetToken.update({
      where: { token: input.token },
      data: { used: true },
    });

    return { 
      success: true, 
      message: 'Password reset successfully' 
    };
  });

export default resetPasswordProcedure;
