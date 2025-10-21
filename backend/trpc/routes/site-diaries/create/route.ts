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
    try {
      if (!ctx.user) {
        throw new Error("Unauthorized");
      }

      console.log("[SiteDiary Create] User:", ctx.user.id, ctx.user.name);
      console.log("[SiteDiary Create] Company:", ctx.user.currentCompanyId);
      console.log("[SiteDiary Create] Input:", JSON.stringify(input, null, 2));

      if (!ctx.user.currentCompanyId) {
        throw new Error("No company selected");
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
          companyId: ctx.user.currentCompanyId,
          weather: input.weather ?? null,
          temperature: input.temperature ?? null,
          workDescription: input.workDescription,
          progress: input.progress ?? null,
          delays: input.delays ?? null,
          safetyIssues: input.safetyIssues ?? null,
          visitors: input.visitors ?? null,
          workersOnSite: input.workersOnSite ?? null,
          equipmentUsed: input.equipmentUsed ?? [],
          materials: input.materials ?? [],
          photos: input.photos ?? [],
          notes: input.notes ?? null,
          status: input.status ?? "draft",
        },
      });
      
      console.log("[SiteDiary Create] Created diary object:", {
        id: siteDiary.id,
        equipmentUsed: siteDiary.equipmentUsed,
        materials: siteDiary.materials,
      });

      console.log("[SiteDiary Create] Success:", siteDiary.id);

      return {
        success: true,
        id: siteDiary.id,
        diary: {
          id: siteDiary.id,
          date: siteDiary.date.toISOString(),
          projectId: siteDiary.projectId,
          projectName: siteDiary.projectName,
          status: siteDiary.status,
        },
      };
    } catch (error) {
      console.error("[SiteDiary Create] Error:", error);
      throw error;
    }
  });
