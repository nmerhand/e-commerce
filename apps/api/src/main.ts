import "dotenv/config";
import { createApp } from "./app";
import { createCatalogService } from "./modules/catalog/catalog.service";
import { PrismaProductRepository } from "./modules/catalog/catalog.repository";

const port = Number(process.env.API_PORT ?? 3000);
const catalogService = createCatalogService(new PrismaProductRepository());
const app = createApp(catalogService);

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
