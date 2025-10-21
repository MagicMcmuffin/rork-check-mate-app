import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { prisma } from "../../../../lib/prisma";

export const createSiteDiaryProcedure = protectedProcedure
  .input(
    z.object({
      date: z.string(),
      projectId: z.string(),
      projectName: z.string(),
      weather: z.string().optional(),
      temperature: z.string().optional(),
      workDescription: z.string(),
      progress: z.string().optional(),
      delays: z.string().optional(),
      safetyIssues: z.string().optional(),
      visitors: z.string().optional(),
      workersOnSite: z.number().optional(),
      equipmentUsed: z.array(z.object({
        name: z.string(),
        hours: z.number().optional(),
      })).optional(),
      materials: z.array(z.object({
        name: z.string(),
        quantity: z.string().optional(),
        unit: z.string().optional(),
      })).optional(),
      photos: z.array(z.string()).optional(),
      notes: z.string().optional(),
      status: z.enum(["draft", "completed"]).optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new Error("Unauthorized");
    }

    const userRole = ctx.user.role;
    if (!["supervisor", "management", "administrator", "company"].includes(userRole)) {
      throw new Error("Only supervisors and above can create site diaries");
    }

    const siteDiary = await prisma.siteDiary.create({
      data: {
        date: new Date(input.date),
        projectId: input.projectId,
        projectName: input.projectName,
        supervisorName: ctx.user.name,
        supervisorId: ctx.user.id,
        companyId: ctx.user.currentCompanyId!,
        weather: input.weather,
        temperature: input.temperature,
        workDescription: input.workDescription,
        progress: input.progress,
        delays: input.delays,
        safetyIssues: input.safetyIssues,
        visitors: input.visitors,
        workersOnSite: input.workersOnSite,
        equipmentUsed: input.equipmentUsed || [],
        materials: input.materials || [],
        photos: input.photos,
        notes: input.notes,
        status: input.status || "draft",
      },
    });

    console.log("Site diary created:", siteDiary.id);

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
      equipmentUsed: (siteDiary.equipmentUsed as any) || [],
      materials: (siteDiary.materials as any) || [],
      photos: siteDiary.photos || [],
      notes: siteDiary.notes || undefined,
      status: siteDiary.status as "draft" | "completed",
      sentAt: siteDiary.sentAt?.toISOString() || undefined,
      sentTo: siteDiary.sentTo || [],
      createdAt: siteDiary.createdAt.toISOString(),
      updatedAt: siteDiary.updatedAt.toISOString(),
    };
  });
