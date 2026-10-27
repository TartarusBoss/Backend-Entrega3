export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductPage = {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: Product[];
};

export interface ProductRepository {
  findPage(page: number, limit: number): Promise<ProductPage>;
  findById(id: number): Promise<Product | null>;
  create(data: ProductInput): Promise<Product>;
  update(id: number, data: ProductInput): Promise<Product>;
  delete(id: number): Promise<void>;
}

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;
