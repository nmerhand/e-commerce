import { HttpError } from "../../lib/http-error";
import type {
  AdminRepository,
  AdminService,
  ProductInput,
} from "./admin.types";

export function createAdminService(repository: AdminRepository): AdminService {
  return {
    listCategories: () => repository.listCategories(),
    listProducts: () => repository.listProducts(),
    createProduct: (input) => repository.createProduct(input),
    updateProduct: (id, input) => repository.updateProduct(id, input),
    async deactivateProduct(id) {
      const deactivated = await repository.deactivateProduct(id);
      if (!deactivated) throw new HttpError(404, "Product not found");
    },
    listOrders: () => repository.listOrders(),
    async shipOrder(orderNumber) {
      const order = await repository.shipOrder(orderNumber);
      if (!order) {
        throw new HttpError(409, "Only processing orders can be shipped");
      }
      return order;
    },
  };
}

export type { ProductInput };
