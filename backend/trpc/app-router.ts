import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import registerCompanyRoute from "./routes/auth/register-company/route";
import joinCompanyRoute from "./routes/auth/join-company/route";
import loginRoute from "./routes/auth/login/route";
import logoutRoute from "./routes/auth/logout/route";
import meRoute from "./routes/auth/me/route";
import { createSiteDiaryProcedure } from "./routes/site-diaries/create/route";
import { listSiteDiariesProcedure } from "./routes/site-diaries/list/route";
import { getSiteDiaryProcedure } from "./routes/site-diaries/get/route";
import { updateSiteDiaryProcedure } from "./routes/site-diaries/update/route";
import { deleteSiteDiaryProcedure } from "./routes/site-diaries/delete/route";
import { sendWeeklySiteDiaryProcedure } from "./routes/site-diaries/send-weekly/route";

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
  }),
  siteDiaries: createTRPCRouter({
    create: createSiteDiaryProcedure,
    list: listSiteDiariesProcedure,
    get: getSiteDiaryProcedure,
    update: updateSiteDiaryProcedure,
    delete: deleteSiteDiaryProcedure,
    sendWeekly: sendWeeklySiteDiaryProcedure,
  }),
});

export type AppRouter = typeof appRouter;
