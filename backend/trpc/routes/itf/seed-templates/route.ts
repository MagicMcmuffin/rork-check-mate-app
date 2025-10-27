import { protectedProcedure } from '../../../create-context';

const ITF_TEMPLATES = [
  { itfCode: 'ITF-001', itfTitle: 'Site Clearance', trade: 'Site Preparation & Earthworks', description: 'Verification of site clearance and removal of vegetation, debris, and obstructions' },
  { itfCode: 'ITF-002', itfTitle: 'Excavation to Formation', trade: 'Site Preparation & Earthworks', description: 'Inspection of excavation depth, dimensions, and formation level' },
  { itfCode: 'ITF-003', itfTitle: 'Backfilling & Compaction', trade: 'Site Preparation & Earthworks', description: 'Verification of backfill material and compaction standards' },
  { itfCode: 'ITF-004', itfTitle: 'Subgrade & Subbase Verification', trade: 'Site Preparation & Earthworks', description: 'Inspection of subgrade and subbase layers for compliance' },
  
  { itfCode: 'ITF-005', itfTitle: 'Blinding Concrete', trade: 'Concrete & Structural Works', description: 'Verification of blinding concrete thickness and level' },
  { itfCode: 'ITF-006', itfTitle: 'Rebar Inspection (Footings / Slabs)', trade: 'Concrete & Structural Works', description: 'Inspection of reinforcement placement, spacing, and cover' },
  { itfCode: 'ITF-007', itfTitle: 'Formwork Inspection', trade: 'Concrete & Structural Works', description: 'Verification of formwork alignment, dimensions, and cleanliness' },
  { itfCode: 'ITF-008', itfTitle: 'Pre-Pour Inspection', trade: 'Concrete & Structural Works', description: 'Final inspection before concrete pour including reinforcement and formwork' },
  { itfCode: 'ITF-009', itfTitle: 'Concrete Pour Record', trade: 'Concrete & Structural Works', description: 'Documentation of concrete pour details including mix, volume, and conditions' },
  { itfCode: 'ITF-010', itfTitle: 'Post-Pour Finish & Curing Check', trade: 'Concrete & Structural Works', description: 'Inspection of concrete finish and curing procedures' },
  
  { itfCode: 'ITF-011', itfTitle: 'Pipe Material & Alignment', trade: 'Drainage & Utility Works', description: 'Verification of pipe material, grade, and alignment' },
  { itfCode: 'ITF-012', itfTitle: 'Manhole Construction', trade: 'Drainage & Utility Works', description: 'Inspection of manhole construction and installation' },
  { itfCode: 'ITF-013', itfTitle: 'Joint & Connection Check', trade: 'Drainage & Utility Works', description: 'Verification of pipe joints and connections integrity' },
  { itfCode: 'ITF-014', itfTitle: 'Hydro / Air Pressure Test', trade: 'Drainage & Utility Works', description: 'Testing of drainage systems for leaks and pressure integrity' },
  
  { itfCode: 'ITF-015', itfTitle: 'Subbase Compaction', trade: 'Roadworks & External', description: 'Verification of subbase compaction and density testing' },
  { itfCode: 'ITF-016', itfTitle: 'Asphalt Base & Wearing Course', trade: 'Roadworks & External', description: 'Inspection of asphalt layers thickness and quality' },
  { itfCode: 'ITF-017', itfTitle: 'Kerb & Paving Installation', trade: 'Roadworks & External', description: 'Verification of kerb and paving installation standards' },
  { itfCode: 'ITF-018', itfTitle: 'Road Marking & Signage', trade: 'Roadworks & External', description: 'Inspection of road markings and signage installation' },
  
  { itfCode: 'ITF-019', itfTitle: 'Rebar Couplers / Lap Length', trade: 'Reinforcement & Steelwork', description: 'Verification of rebar couplers and lap length compliance' },
  { itfCode: 'ITF-020', itfTitle: 'Structural Steel Erection', trade: 'Reinforcement & Steelwork', description: 'Inspection of structural steel erection and alignment' },
  { itfCode: 'ITF-021', itfTitle: 'Bolt Tightening / Welding Inspection', trade: 'Reinforcement & Steelwork', description: 'Verification of bolt tightening torque and welding quality' },
  
  { itfCode: 'ITF-022', itfTitle: 'Waterproofing Membrane Installation', trade: 'Waterproofing & Finishes', description: 'Inspection of waterproofing membrane installation and coverage' },
  { itfCode: 'ITF-023', itfTitle: 'Expansion Joint Inspection', trade: 'Waterproofing & Finishes', description: 'Verification of expansion joint installation and sealing' },
  { itfCode: 'ITF-024', itfTitle: 'Concrete Repair / Surface Coating', trade: 'Waterproofing & Finishes', description: 'Inspection of concrete repairs and surface coating application' },
  
  { itfCode: 'ITF-025', itfTitle: 'Snag / Punch List Completion', trade: 'QA/QC Closeout', description: 'Verification of snag list items completion and rectification' },
  { itfCode: 'ITF-026', itfTitle: 'Final Inspection & Handover Sign-off', trade: 'QA/QC Closeout', description: 'Final inspection and sign-off for project handover' },
];

export const seedITFTemplatesProcedure = protectedProcedure.mutation(async ({ ctx }) => {
  const user = ctx.user;
  if (!user) {
    throw new Error('Unauthorized');
  }

  const companyId = user.currentCompanyId;
  if (!companyId) {
    throw new Error('No company selected');
  }

  const existingITFs = await ctx.prisma.inspectionTestForm.findMany({
    where: {
      companyId,
    },
  });

  if (existingITFs.length > 0) {
    return { message: 'ITF templates already exist for this company', count: existingITFs.length };
  }

  const createdITFs = await ctx.prisma.inspectionTestForm.createMany({
    data: ITF_TEMPLATES.map(template => ({
      ...template,
      status: 'planned',
      companyId,
      createdById: user.id,
    })),
  });

  console.log('Seeded ITF templates:', createdITFs.count);
  return { message: 'ITF templates created successfully', count: createdITFs.count };
});
