import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

// 👇 Add `.js` extensions for local modules
import { prisma } from "../lib/prisma.js";
import { getTokenFromRequest, verifyToken } from "../lib/auth.js";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  profilePicture?: string | null;
  currentCompanyId?: string | null;
  password: string;
  createdAt: Date;
  updatedAt: Date;
};

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const token = getTokenFromRequest(opts.req);
  let user: User | null = null;

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });
    }
  }

  return {
    req: opts.req,
    user,
    prisma,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
