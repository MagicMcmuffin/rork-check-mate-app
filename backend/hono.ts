import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

// ✅ Important: prevent cold start Prisma errors in Vercel
import { PrismaClient } from "@prisma/client";
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const app = new Hono();

app.use("*", cors());

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError({ error, type, path }) {
      console.error(`[tRPC Error] Type: ${type}, Path: ${path}`);
      console.error(`[tRPC Error] Message: ${error.message}`);
      if (error.cause) console.error(`[tRPC Cause]:`, error.cause);
    },
  })
);

app.get("/api", (c) => c.json({ status: "ok", message: "API is running" }));

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  console.error("[Hono Error]:", err);
  return c.json({ error: "Internal Server Error", message: err.message }, 500);
});

// ✅ Important for Vercel serverless functions
export const config = {
  runtime: "edge", // or "nodejs" if using Prisma (you can change this if Prisma crashes)
  regions: ["fra1"], // optional region hint
};

export default app;
