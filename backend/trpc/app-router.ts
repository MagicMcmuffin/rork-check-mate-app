import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import sendInspectionNotificationEmail from "./routes/inspections/send-notification-email/route";
import sendInterventionNotificationEmail from "./routes/interventions/send-notification-email/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  inspections: createTRPCRouter({
    sendNotificationEmail: sendInspectionNotificationEmail,
  }),
  interventions: createTRPCRouter({
    sendNotificationEmail: sendInterventionNotificationEmail,
  }),
});

export type AppRouter = typeof appRouter;
