import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';

const deleteITFSchema = z.object({
  id: z.string(),
});

export const deleteITFProcedure = protectedProcedure
  .input(deleteITFSchema)
  .mutation(async ({ ctx, input }) => {
    const user = ctx.user;
    if (!user) {
      throw new Error('Unauthorized');
    }

    const companyId = user.currentCompanyId;
    if (!companyId) {
      throw new Error('No company selected');
    }

    const itf = await ctx.prisma.inspectionTestForm.findFirst({
      where: {
        id: input.id,
        companyId,
      },
    });

    if (!itf) {
      throw new Error('ITF not found');
    }

    await ctx.prisma.inspectionTestForm.delete({
      where: { id: input.id },
    });

    console.log('Deleted ITF:', input.id);
    return { success: true };
  });
