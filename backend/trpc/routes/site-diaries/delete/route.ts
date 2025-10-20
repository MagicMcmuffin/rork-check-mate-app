import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { prisma } from "../../../../lib/prisma";

export const deleteSiteDiaryProcedure = protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new Error("Unauthorized");
    }

    const existingSiteDiary = await prisma.siteDiary.findUnique({
      where: { id: input.id },
    });

    if (!existingSiteDiary) {
      throw new Error("Site diary not found");
    }

    if (existingSiteDiary.companyId !== ctx.user.currentCompanyId) {
      throw new Error("Unauthorized");
    }

    const userRole = ctx.user.role;
    if (!["supervisor", "management", "administrator", "company"].includes(userRole)) {
      throw new Error("Only supervisors and above can delete site diaries");
    }

    await prisma.siteDiary.delete({
      where: { id: input.id },
    });

    console.log("Site diary deleted:", input.id);
    return { success: true };
  });
