import { HttpError } from "../domain/errors";
import type { ProductInput, ProductPage, ProductRepository } from "../domain/product";

export class ProductService {
  constructor(private readonly products: ProductRepository) {}

  list(page: number, limit: number): Promise<ProductPage> {
    return this.products.findPage(page, limit);
  }

  async get(id: number) {
    const product = await this.products.findById(id);
    if (!product) {
      throw new HttpError("Producto no encontrado", 404);
    }

    return product;
  }

  create(data: ProductInput) {
    return this.products.create(data);
  }

  async update(id: number, data: ProductInput) {
    await this.get(id);
    return this.products.update(id, data);
  }

  async delete(id: number) {
    await this.get(id);
    await this.products.delete(id);
  }
}
