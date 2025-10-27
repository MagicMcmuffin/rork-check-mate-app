import { protectedProcedure } from '../../../create-context';

export const listITFsProcedure = protectedProcedure.query(async ({ ctx }) => {
  const user = ctx.user;
  if (!user) {
    throw new Error('Unauthorized');
  }

  const companyId = user.currentCompanyId;
  if (!companyId) {
    throw new Error('No company selected');
  }

  const itfs = await ctx.prisma.inspectionTestForm.findMany({
    where: {
      companyId,
    },
    orderBy: [
      { itfCode: 'asc' },
    ],
  });

  console.log('Fetched ITFs:', itfs.length);
  return itfs;
});
