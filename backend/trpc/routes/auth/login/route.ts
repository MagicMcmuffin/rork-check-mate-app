import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure } from '../../../create-context.js';
import { verifyPassword, signToken, serializeAuthCookie } from '../../../../lib/auth.js';

export const loginProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
      include: {
        currentCompany: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    }

    const isValidPassword = await verifyPassword(input.password, user.password);

    if (!isValidPassword) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      companyId: user.currentCompanyId || undefined,
    });

    const cookie = serializeAuthCookie(token);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profilePicture: user.profilePicture,
        currentCompanyId: user.currentCompanyId,
      },
      company: user.currentCompany || null,
      token,
      cookie,
    };
  });

export default loginProcedure;
