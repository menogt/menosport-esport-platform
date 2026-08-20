import express, { type Express } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";

function createConfiguredApp(trpcPath: string): Express {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.use(
    trpcPath,
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}

export function createApp(): Express {
  return createConfiguredApp("/api/trpc");
}

export function createVercelApiApp(): Express {
  return createConfiguredApp("/");
}
