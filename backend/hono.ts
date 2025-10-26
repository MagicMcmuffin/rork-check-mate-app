export const config = {
  runtime: "nodejs",
};

import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", cors());

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError({ error, type, path }) {
      console.error(`[tRPC Backend Error] Type: ${type}, Path: ${path}`);
      console.error(`[tRPC Backend Error] Code: ${error.code}`);
      console.error(`[tRPC Backend Error] Message: ${error.message}`);
      if (error.cause) {
        console.error(`[tRPC Backend Error] Cause:`, error.cause);
      }
    },
  })
);

app.get("/api", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

app.onError((err, c) => {
  console.error('[Hono Error]:', err);
  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message,
    },
    500
  );
});

export default app;
