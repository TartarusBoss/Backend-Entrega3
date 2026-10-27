import type { ProductPage, ProductRepository } from "../domain/product";

export class ProductService {
  constructor(private readonly products: ProductRepository) {}

  list(page: number, limit: number): Promise<ProductPage> {
    return this.products.findPage(page, limit);
  }

  async get(id: number) {
    const product = await this.products.findById(id);
    if (!product) {
      const error = new Error("Producto no encontrado");
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return product;
  }
}
