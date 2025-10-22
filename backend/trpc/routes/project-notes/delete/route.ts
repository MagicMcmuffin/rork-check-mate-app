import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';

export const deleteProjectNoteProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string(),
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
      throw new Error('Only site supervisors and above can delete project notes');
    }

    const note = await ctx.prisma.projectNote.findUnique({
      where: { id: input.id },
    });

    if (!note) {
      throw new Error('Project note not found');
    }

    if (note.companyId !== companyId) {
      throw new Error('Unauthorized');
    }

    await ctx.prisma.projectNote.delete({
      where: { id: input.id },
    });

    console.log('Project note deleted:', input.id);
    return { success: true };
  });
