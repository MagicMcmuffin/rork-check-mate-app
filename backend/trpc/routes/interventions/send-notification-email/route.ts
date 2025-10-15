import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { sendEmail, getInspectionEmailRecipients, generatePositiveInterventionEmailHTML } from '../../../../services/email';

const sendInterventionEmailSchema = z.object({
  employeeName: z.string(),
  date: z.string(),
  projectName: z.string().optional(),
  hazardDescription: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  actionTaken: z.string(),
  site: z.string().optional(),
  location: z.string().optional(),
  companyName: z.string(),
  companyEmail: z.string(),
  projectEmails: z.array(z.string()).optional(),
  adminEmails: z.array(z.string()).optional(),
});

export default publicProcedure
  .input(sendInterventionEmailSchema)
  .mutation(async ({ input }) => {
    try {
      const recipients = getInspectionEmailRecipients({
        companyEmail: input.companyEmail,
        projectEmails: input.projectEmails,
        adminEmails: input.adminEmails,
      });

      if (recipients.length === 0) {
        console.log('No email recipients configured');
        return { success: false, message: 'No recipients configured' };
      }

      const emailHTML = generatePositiveInterventionEmailHTML({
        companyName: input.companyName,
        employeeName: input.employeeName,
        date: input.date,
        projectName: input.projectName,
        hazardDescription: input.hazardDescription,
        severity: input.severity,
        actionTaken: input.actionTaken,
        site: input.site,
        location: input.location,
      });

      const subject = `🛡️ Positive Intervention - ${input.employeeName}`;

      const result = await sendEmail({
        to: recipients,
        subject,
        html: emailHTML,
      });

      return result;
    } catch (error) {
      console.error('Error in sendInterventionEmail:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to send email notification' 
      };
    }
  });
