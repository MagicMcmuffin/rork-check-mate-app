import { createTRPCRouter } from "./create-context.js";

import hiRoute from "./routes/example/hi/route.js";
import registerCompanyRoute from "./routes/auth/register-company/route.js";
import joinCompanyRoute from "./routes/auth/join-company/route.js";
import loginRoute from "./routes/auth/login/route.js";
import logoutRoute from "./routes/auth/logout/route.js";
import meRoute from "./routes/auth/me/route.js";
import forgotPasswordRoute from "./routes/auth/forgot-password/route.js";
import resetPasswordRoute from "./routes/auth/reset-password/route.js";

import { createSiteDiaryProcedure } from "./routes/site-diaries/create/route.js";
import { listSiteDiariesProcedure } from "./routes/site-diaries/list/route.js";
import { getSiteDiaryProcedure } from "./routes/site-diaries/get/route.js";
import { updateSiteDiaryProcedure } from "./routes/site-diaries/update/route.js";
import { deleteSiteDiaryProcedure } from "./routes/site-diaries/delete/route.js";
import { sendWeeklySiteDiaryProcedure } from "./routes/site-diaries/send-weekly/route.js";

import { createProjectNoteProcedure } from "./routes/project-notes/create/route.js";
import { listProjectNotesProcedure } from "./routes/project-notes/list/route.js";
import { deleteProjectNoteProcedure } from "./routes/project-notes/delete/route.js";

import { listITFsProcedure } from "./routes/itf/list/route.js";
import { createITFProcedure } from "./routes/itf/create/route.js";
import { updateITFProcedure } from "./routes/itf/update/route.js";
import { deleteITFProcedure } from "./routes/itf/delete/route.js";
import { seedITFTemplatesProcedure } from "./routes/itf/seed-templates/route.js";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    registerCompany: registerCompanyRoute,
    joinCompany: joinCompanyRoute,
    login: loginRoute,
    logout: logoutRoute,
    me: meRoute,
    forgotPassword: forgotPasswordRoute,
    resetPassword: resetPasswordRoute,
  }),
  siteDiaries: createTRPCRouter({
    create: createSiteDiaryProcedure,
    list: listSiteDiariesProcedure,
    get: getSiteDiaryProcedure,
    update: updateSiteDiaryProcedure,
    delete: deleteSiteDiaryProcedure,
    sendWeekly: sendWeeklySiteDiaryProcedure,
  }),
  projectNotes: createTRPCRouter({
    create: createProjectNoteProcedure,
    list: listProjectNotesProcedure,
    delete: deleteProjectNoteProcedure,
  }),
  itf: createTRPCRouter({
    list: listITFsProcedure,
    create: createITFProcedure,
    update: updateITFProcedure,
    delete: deleteITFProcedure,
    seedTemplates: seedITFTemplatesProcedure,
  }),
});

export type AppRouter = typeof appRouter;
