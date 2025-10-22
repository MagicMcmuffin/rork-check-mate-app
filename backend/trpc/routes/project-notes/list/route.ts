import { protectedProcedure } from '../../../create-context';

export const listProjectNotesProcedure = protectedProcedure.query(async ({ ctx }) => {
  const user = ctx.user;
  if (!user) {
    throw new Error('Unauthorized');
  }

  const companyId = user.currentCompanyId;
  if (!companyId) {
    throw new Error('No company selected');
  }

  const notes = await ctx.prisma.projectNote.findMany({
    where: {
      companyId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log('Fetched project notes:', notes.length);
  return notes;
});
