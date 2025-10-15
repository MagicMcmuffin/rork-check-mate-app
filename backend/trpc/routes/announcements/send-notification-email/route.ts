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

    if (!result.success) {
      throw new Error(result.message || 'Failed to send announcement email');
    }

    return { success: true };
  });
