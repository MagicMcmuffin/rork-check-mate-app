import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';

const updateITFSchema = z.object({
  id: z.string(),
  status: z.enum(['planned', 'in-progress', 'approved']).optional(),
  date: z.string().optional(),
  inspectorName: z.string().optional(),
  engineerName: z.string().optional(),
  documentUri: z.string().optional(),
  documentName: z.string().optional(),
  documentType: z.string().optional(),
  notes: z.string().optional(),
});

export const updateITFProcedure = protectedProcedure
  .input(updateITFSchema)
  .mutation(async ({ ctx, input }) => {
    const user = ctx.user;
    if (!user) {
      throw new Error('Unauthorized');
    }

    const companyId = user.currentCompanyId;
    if (!companyId) {
      throw new Error('No company selected');
    }

    const { id, ...updateData } = input;

    const itf = await ctx.prisma.inspectionTestForm.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!itf) {
      throw new Error('ITF not found');
    }

    const updatedITF = await ctx.prisma.inspectionTestForm.update({
      where: { id },
      data: {
        ...updateData,
        date: updateData.date ? new Date(updateData.date) : undefined,
      },
    });

    console.log('Updated ITF:', updatedITF.id);
    return updatedITF;
  });
