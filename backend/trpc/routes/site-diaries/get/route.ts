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
    
    return {
      id: siteDiary.id,
      date: siteDiary.date.toISOString(),
      projectId: siteDiary.projectId,
      projectName: siteDiary.projectName,
      supervisorName: siteDiary.supervisorName,
      supervisorId: siteDiary.supervisorId,
      companyId: siteDiary.companyId,
      weather: siteDiary.weather || undefined,
      temperature: siteDiary.temperature || undefined,
      workDescription: siteDiary.workDescription,
      progress: siteDiary.progress || undefined,
      delays: siteDiary.delays || undefined,
      safetyIssues: siteDiary.safetyIssues || undefined,
      visitors: siteDiary.visitors || undefined,
      workersOnSite: siteDiary.workersOnSite || undefined,
      equipmentUsed: siteDiary.equipmentUsed as { name: string; hours?: number }[],
      materials: siteDiary.materials as { name: string; quantity?: string; unit?: string }[],
      photos: siteDiary.photos || [],
      notes: siteDiary.notes || undefined,
      status: siteDiary.status as "draft" | "completed",
      sentAt: siteDiary.sentAt?.toISOString() || undefined,
      sentTo: siteDiary.sentTo || [],
      createdAt: siteDiary.createdAt.toISOString(),
      updatedAt: siteDiary.updatedAt.toISOString(),
    };
  });
