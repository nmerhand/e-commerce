import type {
  OrderRepository,
  OrderService,
  ShippingAddress,
} from "./order.types";

export function createOrderService(repository: OrderRepository): OrderService {
  return {
    checkout(userId: string, address: ShippingAddress) {
      return repository.checkout(userId, address);
    },
    listForUser(userId: string) {
      return repository.listForUser(userId);
    },
    findForUser(userId: string, orderNumber: string) {
      return repository.findForUser(userId, orderNumber);
    },
  };
}
