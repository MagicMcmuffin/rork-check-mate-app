import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import registerCompanyRoute from "./routes/auth/register-company/route";
import joinCompanyRoute from "./routes/auth/join-company/route";
import loginRoute from "./routes/auth/login/route";
import logoutRoute from "./routes/auth/logout/route";
import meRoute from "./routes/auth/me/route";

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
});

export type AppRouter = typeof appRouter;
