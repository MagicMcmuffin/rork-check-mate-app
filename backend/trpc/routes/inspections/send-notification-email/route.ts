import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { sendEmail, getInspectionEmailRecipients, generateInspectionEmailHTML } from '../../../../services/email';

const sendNotificationEmailSchema = z.object({
  inspectionType: z.enum(['plant', 'quickhitch', 'vehicle', 'bucket']),
  equipmentName: z.string(),
  operatorName: z.string(),
  date: z.string(),
  projectName: z.string().optional(),
  failedChecks: z.array(z.object({
    name: z.string(),
    status: z.string(),
    notes: z.string().optional(),
  })),
  notesOnDefects: z.string().optional(),
  companyName: z.string(),
  companyEmail: z.string(),
  projectEmails: z.array(z.string()).optional(),
  adminEmails: z.array(z.string()).optional(),
});

export default publicProcedure
  .input(sendNotificationEmailSchema)
  .mutation(async ({ input }) => {
    const recipients = getInspectionEmailRecipients({
      companyEmail: input.companyEmail,
      projectEmails: input.projectEmails,
      adminEmails: input.adminEmails,
    });

    if (recipients.length === 0) {
      console.log('No email recipients configured');
      return { success: false, message: 'No recipients configured' };
    }

    const emailHTML = generateInspectionEmailHTML({
      inspectionType: input.inspectionType,
      equipmentName: input.equipmentName,
      operatorName: input.operatorName,
      date: input.date,
      projectName: input.projectName,
      failedChecks: input.failedChecks,
      notesOnDefects: input.notesOnDefects,
      companyName: input.companyName,
    });

    const subject = `⚠️ Inspection Alert - ${input.equipmentName} - ${input.inspectionType.toUpperCase()}`;

    const result = await sendEmail({
      to: recipients,
      subject,
      html: emailHTML,
    });

    return result;
  });
