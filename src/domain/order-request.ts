export type OrderRequest = {
  id: number;
  userId: number;
  productId: number;
  message: string;
  status: string;
  createdAt: Date;
  product: { id: number; name: string; category: string; price: number; image: string };
};

export interface OrderRequestRepository {
  create(data: { userId: number; productId: number; message: string }): Promise<OrderRequest>;
  findByUser(userId: number): Promise<OrderRequest[]>;
  findAll(): Promise<OrderRequest[]>;
}
