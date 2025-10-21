import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { prisma } from "../../../../lib/prisma";

export const updateSiteDiaryProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      date: z.string().optional(),
      projectId: z.string().optional(),
      projectName: z.string().optional(),
      weather: z.string().optional(),
      temperature: z.string().optional(),
      workDescription: z.string().optional(),
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
      throw new Error("Only supervisors and above can update site diaries");
    }

    const updateData: any = {};

    if (input.date) updateData.date = new Date(input.date);
    if (input.projectId) updateData.projectId = input.projectId;
    if (input.projectName) updateData.projectName = input.projectName;
    if (input.weather !== undefined) updateData.weather = input.weather || null;
    if (input.temperature !== undefined) updateData.temperature = input.temperature || null;
    if (input.workDescription) updateData.workDescription = input.workDescription;
    if (input.progress !== undefined) updateData.progress = input.progress || null;
    if (input.delays !== undefined) updateData.delays = input.delays || null;
    if (input.safetyIssues !== undefined) updateData.safetyIssues = input.safetyIssues || null;
    if (input.visitors !== undefined) updateData.visitors = input.visitors || null;
    if (input.workersOnSite !== undefined) updateData.workersOnSite = input.workersOnSite;
    if (input.equipmentUsed) updateData.equipmentUsed = input.equipmentUsed;
    if (input.materials) updateData.materials = input.materials;
    if (input.photos) updateData.photos = input.photos;
    if (input.notes !== undefined) updateData.notes = input.notes || null;
    if (input.status) updateData.status = input.status;

    const siteDiary = await prisma.siteDiary.update({
      where: { id: input.id },
      data: updateData,
    });

    console.log("Site diary updated:", siteDiary.id);

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
