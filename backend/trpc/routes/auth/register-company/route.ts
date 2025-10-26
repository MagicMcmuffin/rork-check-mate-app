import { z } from "zod";
import { TRPCError } from "@trpc/server";
// 👇 Add .js extensions for NodeNext compatibility
import { publicProcedure } from "../../../create-context.js";
import {
  hashPassword,
  signToken,
  serializeAuthCookie,
} from "../../../../lib/auth.js";

export const registerCompanyProcedure = publicProcedure
  .input(
    z.object({
      ownerName: z.string().min(1),
      companyName: z.string().min(1),
      companyEmail: z.string().email(),
      personalEmail: z.string().email(),
      password: z.string().min(6),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const existingUser = await ctx.prisma.user.findUnique({
      where: { email: input.personalEmail.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Email already registered",
      });
    }

    const generateCompanyCode = (): string => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let companyCode = generateCompanyCode();
    let codeExists = await ctx.prisma.company.findUnique({
      where: { code: companyCode },
    });

    while (codeExists) {
      companyCode = generateCompanyCode();
      codeExists = await ctx.prisma.company.findUnique({
        where: { code: companyCode },
      });
    }

    const hashedPassword = await hashPassword(input.password);

    const user = await ctx.prisma.user.create({
      data: {
        email: input.personalEmail.toLowerCase().trim(),
        password: hashedPassword,
        name: input.ownerName,
        role: "company",
      },
    });

    const company = await ctx.prisma.company.create({
      data: {
        name: input.companyName,
        code: companyCode,
        email: input.companyEmail,
        ownerId: user.id,
      },
    });

    await ctx.prisma.userCompany.create({
      data: {
        userId: user.id,
        companyId: company.id,
      },
    });

    await ctx.prisma.user.update({
      where: { id: user.id },
      data: { currentCompanyId: company.id },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      companyId: company.id,
    });

    const cookie = serializeAuthCookie(token);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
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

export default registerCompanyProcedure;
