import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { prisma } from "../../../../lib/prisma";
import { sendEmail } from "../../../../services/email";

export const sendWeeklySiteDiaryProcedure = protectedProcedure
  .input(
    z.object({
      diaryIds: z.array(z.string()),
      recipients: z.array(z.string()).optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new Error("Unauthorized");
    }

    const userRole = ctx.user.role;
    if (!["supervisor", "management", "administrator", "company"].includes(userRole)) {
      throw new Error("Only supervisors and above can send site diaries");
    }

    const siteDiaries = await prisma.siteDiary.findMany({
      where: {
        id: { in: input.diaryIds },
        companyId: ctx.user.currentCompanyId,
      },
      orderBy: {
        date: "asc",
      },
    });

    if (siteDiaries.length === 0) {
      throw new Error("No site diaries found");
    }

    const projectName = siteDiaries[0].projectName;
    const startDate = new Date(siteDiaries[0].date).toLocaleDateString();
    const endDate = new Date(siteDiaries[siteDiaries.length - 1].date).toLocaleDateString();

    let emailHtml = `
      <h2>Weekly Site Diary Report</h2>
      <p><strong>Project:</strong> ${projectName}</p>
      <p><strong>Period:</strong> ${startDate} - ${endDate}</p>
      <p><strong>Supervisor:</strong> ${ctx.user.name}</p>
      <hr />
    `;

    for (const diary of siteDiaries) {
      const diaryDate = new Date(diary.date).toLocaleDateString();
      emailHtml += `
        <h3>Date: ${diaryDate}</h3>
        <p><strong>Weather:</strong> ${diary.weather || "N/A"}</p>
        <p><strong>Temperature:</strong> ${diary.temperature || "N/A"}</p>
        <p><strong>Workers on Site:</strong> ${diary.workersOnSite || "N/A"}</p>
        <p><strong>Work Description:</strong> ${diary.workDescription}</p>
        ${diary.progress ? `<p><strong>Progress:</strong> ${diary.progress}</p>` : ""}
        ${diary.delays ? `<p><strong>Delays:</strong> ${diary.delays}</p>` : ""}
        ${diary.safetyIssues ? `<p><strong>Safety Issues:</strong> ${diary.safetyIssues}</p>` : ""}
        ${diary.visitors ? `<p><strong>Visitors:</strong> ${diary.visitors}</p>` : ""}
        ${diary.notes ? `<p><strong>Notes:</strong> ${diary.notes}</p>` : ""}
        <hr />
      `;
    }

    let recipients: string[] = [];
    if (input.recipients && input.recipients.length > 0) {
      recipients = input.recipients;
    } else {
      const project = await prisma.project.findFirst({
        where: {
          id: siteDiaries[0].projectId,
          companyId: ctx.user.currentCompanyId,
        },
      });

      if (project && project.emails && project.emails.length > 0) {
        recipients = project.emails;
      }
    }

    if (recipients.length === 0) {
      throw new Error("No recipients found. Please add recipients or configure project emails.");
    }

    try {
      await sendEmail({
        to: recipients,
        subject: `Weekly Site Diary: ${projectName} (${startDate} - ${endDate})`,
        html: emailHtml,
      });
    } catch (error) {
      console.error("Failed to send weekly site diary email", error);
      throw new Error("Failed to send email");
    }

    for (const diaryId of input.diaryIds) {
      await prisma.siteDiary.update({
        where: { id: diaryId },
        data: {
          sentAt: new Date(),
          sentTo: recipients,
          status: "completed",
        },
      });
    }

    console.log("Weekly site diary sent to", recipients.length, "recipients");
    return { success: true, recipients };
  });
