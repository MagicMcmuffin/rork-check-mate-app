import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';

export const createProjectNoteProcedure = protectedProcedure
  .input(
    z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      category: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const user = ctx.user;
    if (!user) {
      throw new Error('Unauthorized');
    }

    const companyId = user.currentCompanyId;
    if (!companyId) {
      throw new Error('No company selected');
    }

    const isSupervisorOrAbove = ['supervisor', 'management', 'administrator', 'company'].includes(user.role);
    if (!isSupervisorOrAbove) {
      throw new Error('Only site supervisors and above can add project notes');
    }

    const note = await ctx.prisma.projectNote.create({
      data: {
        title: input.title,
        content: input.content,
        category: input.category,
        companyId,
        authorId: user.id,
        authorName: user.name,
      },
    });

    console.log('Project note created:', note.id);
    return note;
  });
