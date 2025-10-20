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
    
    return siteDiaries.map((diary: typeof siteDiaries[0]) => {
      const equipmentUsed = diary.equipmentUsed as any;
      const materials = diary.materials as any;
      const photos = diary.photos;
      const sentTo = diary.sentTo;

      return {
        id: diary.id,
        date: diary.date.toISOString(),
        projectId: diary.projectId,
        projectName: diary.projectName,
        supervisorName: diary.supervisorName,
        supervisorId: diary.supervisorId,
        companyId: diary.companyId,
        weather: diary.weather || undefined,
        temperature: diary.temperature || undefined,
        workDescription: diary.workDescription,
        progress: diary.progress || undefined,
        delays: diary.delays || undefined,
        safetyIssues: diary.safetyIssues || undefined,
        visitors: diary.visitors || undefined,
        workersOnSite: diary.workersOnSite || undefined,
        equipmentUsed: Array.isArray(equipmentUsed) ? JSON.parse(JSON.stringify(equipmentUsed)) : [],
        materials: Array.isArray(materials) ? JSON.parse(JSON.stringify(materials)) : [],
        photos: Array.isArray(photos) ? [...photos] : [],
        notes: diary.notes || undefined,
        status: diary.status as "draft" | "completed",
        sentAt: diary.sentAt?.toISOString() || undefined,
        sentTo: Array.isArray(sentTo) ? [...sentTo] : [],
        createdAt: diary.createdAt.toISOString(),
        updatedAt: diary.updatedAt.toISOString(),
      };
    });
  });
