import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { prisma } from "../../../../lib/prisma";

export const getSiteDiaryProcedure = protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new Error("Unauthorized");
    }

    const siteDiary = await prisma.siteDiary.findUnique({
      where: {
        id: input.id,
      },
    });

    if (!siteDiary) {
      throw new Error("Site diary not found");
    }

    if (siteDiary.companyId !== ctx.user.currentCompanyId) {
      throw new Error("Unauthorized");
    }

    console.log("Site diary fetched:", siteDiary.id);
    return siteDiary;
  });
