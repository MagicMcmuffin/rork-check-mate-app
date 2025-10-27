import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure } from '../../../create-context.js';
import { hashPassword, signToken, serializeAuthCookie } from '../../../../lib/auth.js';

export const joinCompanyProcedure = publicProcedure
  .input(
    z.object({
      code: z.string().min(6).max(6),
      employeeName: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
      profilePicture: z.string().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const normalizedCode = input.code.trim().toUpperCase();

    const company = await ctx.prisma.company.findUnique({
      where: { code: normalizedCode },
    });

    if (!company) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Invalid company code',
      });
    }

    const existingUser = await ctx.prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
      include: {
        companies: true,
      },
    });

    if (existingUser) {
      const alreadyInCompany = existingUser.companies.some(
        (uc: { companyId: string }) => uc.companyId === company.id
      );

      if (alreadyInCompany) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Already joined this company',
        });
      }

      await ctx.prisma.userCompany.create({
        data: {
          userId: existingUser.id,
          companyId: company.id,
        },
      });

      await ctx.prisma.user.update({
        where: { id: existingUser.id },
        data: { currentCompanyId: company.id },
      });

      const token = signToken({
        userId: existingUser.id,
        email: existingUser.email,
        companyId: company.id,
      });

      const cookie = serializeAuthCookie(token);

      return {
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          currentCompanyId: company.id,
        },
        company: {
          id: company.id,
          name: company.name,
          code: company.code,
          email: company.email,
        },
        token,
        cookie,
      };
    }

    const hashedPassword = await hashPassword(input.password);

    const newUser = await ctx.prisma.user.create({
      data: {
        email: input.email.toLowerCase().trim(),
        password: hashedPassword,
        name: input.employeeName,
        role: 'employee',
        profilePicture: input.profilePicture,
        currentCompanyId: company.id,
      },
    });

    await ctx.prisma.userCompany.create({
      data: {
        userId: newUser.id,
        companyId: company.id,
      },
    });

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      companyId: company.id,
    });

    const cookie = serializeAuthCookie(token);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        currentCompanyId: company.id,
      },
      company: {
        id: company.id,
        name: company.name,
        code: company.code,
        email: company.email,
      },
      token,
      cookie,
    };
  });

export default joinCompanyProcedure;
