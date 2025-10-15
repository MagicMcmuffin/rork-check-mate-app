import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { sendEmail, generateAnnouncementEmailHTML } from '../../../../services/email';

export const sendAnnouncementNotificationEmailProcedure = publicProcedure
  .input(
    z.object({
      companyName: z.string(),
      title: z.string(),
      message: z.string(),
      priority: z.enum(['low', 'normal', 'high']),
      authorName: z.string(),
      date: z.string(),
      recipientEmails: z.array(z.string()),
    })
  )
  .mutation(async ({ input }) => {
    try {
      if (!input.recipientEmails || input.recipientEmails.length === 0) {
        console.log('No email recipients configured for announcement');
        return { success: false, message: 'No recipients configured' };
      }

      const html = generateAnnouncementEmailHTML({
        companyName: input.companyName,
        title: input.title,
        message: input.message,
        priority: input.priority,
        authorName: input.authorName,
        date: input.date,
      });

      const priorityText = input.priority === 'high' ? 'URGENT' : input.priority === 'normal' ? 'Announcement' : 'Info';
      const subject = `[${priorityText}] ${input.title} - ${input.companyName}`;

      const result = await sendEmail({
        to: input.recipientEmails,
        subject,
        html,
      });

      return result;
    } catch (error) {
      console.error('Error in sendAnnouncementEmail:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to send announcement email' 
      };
    }
  });
