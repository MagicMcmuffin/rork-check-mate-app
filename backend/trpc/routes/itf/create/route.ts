import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';

const createITFSchema = z.object({
  itfCode: z.string(),
  itfTitle: z.string(),
  trade: z.string(),
  description: z.string(),
  status: z.enum(['planned', 'in-progress', 'approved']).default('planned'),
  date: z.string().optional(),
  inspectorName: z.string().optional(),
  engineerName: z.string().optional(),
  documentUri: z.string().optional(),
  documentName: z.string().optional(),
  documentType: z.string().optional(),
  notes: z.string().optional(),
});

export const createITFProcedure = protectedProcedure
  .input(createITFSchema)
  .mutation(async ({ ctx, input }) => {
    const user = ctx.user;
    if (!user) {
      throw new Error('Unauthorized');
    }

    const companyId = user.currentCompanyId;
    if (!companyId) {
      throw new Error('No company selected');
    }

    const itf = await ctx.prisma.inspectionTestForm.create({
      data: {
        itfCode: input.itfCode,
        itfTitle: input.itfTitle,
        trade: input.trade,
        description: input.description,
        status: input.status,
        date: input.date ? new Date(input.date) : null,
        inspectorName: input.inspectorName,
        engineerName: input.engineerName,
        documentUri: input.documentUri,
        documentName: input.documentName,
        documentType: input.documentType,
        notes: input.notes,
        companyId,
        createdById: user.id,
      },
    });

    console.log('Created ITF:', itf.id);
    return itf;
  });
