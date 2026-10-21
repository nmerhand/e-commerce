import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createCatalogRouter } from "./modules/catalog/catalog.routes";
import type { CatalogService } from "./modules/catalog/catalog.types";

export function createApp(catalogService: CatalogService) {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });
  app.use("/api/products", createCatalogRouter(catalogService));
  app.use((_request, response) => {
    response.status(404).json({ error: "Route not found" });
  });
  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      next: express.NextFunction,
    ) => {
      if (response.headersSent) {
        next(error);
        return;
      }

      console.error("Unhandled API error", error);
      response.status(500).json({ error: "Internal server error" });
    },
  );

  return app;
}
