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

    const equipmentUsedData = input.equipmentUsed && input.equipmentUsed.length > 0 
      ? input.equipmentUsed 
      : [];
    const materialsData = input.materials && input.materials.length > 0
      ? input.materials
      : [];
    const photosData = input.photos && input.photos.length > 0
      ? input.photos
      : [];

    const siteDiary = await prisma.siteDiary.create({
      data: {
        date: new Date(input.date),
        projectId: input.projectId,
        projectName: input.projectName,
        supervisorName: ctx.user.name,
        supervisorId: ctx.user.id,
        companyId: ctx.user.currentCompanyId!,
        weather: input.weather || null,
        temperature: input.temperature || null,
        workDescription: input.workDescription,
        progress: input.progress || null,
        delays: input.delays || null,
        safetyIssues: input.safetyIssues || null,
        visitors: input.visitors || null,
        workersOnSite: input.workersOnSite || null,
        equipmentUsed: equipmentUsedData,
        materials: materialsData,
        photos: photosData,
        notes: input.notes || null,
        status: input.status || "draft",
        sentTo: [],
        sentAt: null,
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
      weather: siteDiary.weather,
      temperature: siteDiary.temperature,
      workDescription: siteDiary.workDescription,
      progress: siteDiary.progress,
      delays: siteDiary.delays,
      safetyIssues: siteDiary.safetyIssues,
      visitors: siteDiary.visitors,
      workersOnSite: siteDiary.workersOnSite,
      equipmentUsed: siteDiary.equipmentUsed as typeof equipmentUsedData,
      materials: siteDiary.materials as typeof materialsData,
      photos: siteDiary.photos,
      notes: siteDiary.notes,
      status: siteDiary.status,
      sentTo: siteDiary.sentTo,
      sentAt: siteDiary.sentAt?.toISOString() || null,
      createdAt: siteDiary.createdAt.toISOString(),
      updatedAt: siteDiary.updatedAt.toISOString(),
    };
  });
