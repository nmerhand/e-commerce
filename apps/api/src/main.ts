import "dotenv/config";
import { createApp } from "./app";
import { PrismaAuthRepository } from "./modules/auth/auth.repository";
import { createAuthService } from "./modules/auth/auth.service";
import { createCatalogService } from "./modules/catalog/catalog.service";
import { PrismaProductRepository } from "./modules/catalog/catalog.repository";

const port = Number(process.env.API_PORT ?? 3000);
const catalogService = createCatalogService(new PrismaProductRepository());
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set before starting the API");
}

const authService = createAuthService(
  new PrismaAuthRepository(),
  sessionSecret,
);
const app = createApp(catalogService, authService);

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
