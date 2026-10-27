import { HttpError } from "../domain/errors";
import type { OrderRequestRepository } from "../domain/order-request";
import type { ProductRepository } from "../domain/product";

export class OrderRequestService {
  constructor(
    private readonly requests: OrderRequestRepository,
    private readonly products: ProductRepository,
  ) {}

  async create(userId: number, productId: number, message: string) {
    if (!(await this.products.findById(productId))) {
      throw new HttpError("Producto no encontrado", 404);
    }
    return this.requests.create({ userId, productId, message });
  }

  mine(userId: number) {
    return this.requests.findByUser(userId);
  }

  all() {
    return this.requests.findAll();
  }
}
