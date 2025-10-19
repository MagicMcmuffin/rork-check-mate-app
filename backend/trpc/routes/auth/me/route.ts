import { protectedProcedure } from '../../../create-context';

export const meProcedure = protectedProcedure.query(async ({ ctx }) => {
  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.user.id },
    include: {
      currentCompany: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePicture: user.profilePicture,
      currentCompanyId: user.currentCompanyId,
    },
    company: user.currentCompany || null,
  };
});

export default meProcedure;
