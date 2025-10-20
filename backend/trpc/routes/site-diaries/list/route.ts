import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { prisma } from "../../../../lib/prisma";

export const listSiteDiariesProcedure = protectedProcedure
  .input(
    z.object({
      projectId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      status: z.enum(["draft", "completed"]).optional(),
    }).optional()
  )
  .query(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new Error("Unauthorized");
    }

    const where: any = {
      companyId: ctx.user.currentCompanyId,
    };

    if (input?.projectId) {
      where.projectId = input.projectId;
    }

    if (input?.status) {
      where.status = input.status;
    }

    if (input?.startDate || input?.endDate) {
      where.date = {};
      if (input.startDate) {
        where.date.gte = new Date(input.startDate);
      }
      if (input.endDate) {
        where.date.lte = new Date(input.endDate);
      }
    }

    const siteDiaries = await prisma.siteDiary.findMany({
      where,
      orderBy: {
        date: "desc",
      },
    });

    console.log("Site diaries fetched:", siteDiaries.length);
    return siteDiaries;
  });
