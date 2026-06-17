export type Condition   = 'new' | 'used';
export type Availability = 'available' | 'sold' | 'reserved';
export type Currency    = 'GHS' | 'USD' | 'EUR';

export interface ProductImage {
  id: string;
  url: string;
  public_id: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  condition: Condition;
  availability: Availability;
  category: string;
  make: string;
  model: string;
  year: number;
  colour?: string;
  thumbnail: string | null;
}

export interface ProductDetail extends ProductSummary {
  description: string;
  mileage?: number;
  features: string[];
  images: ProductImage[];
  is_published: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface ListResult {
  products: ProductSummary[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ListProductsQuery {
  page?: number;
  limit?: number;
  condition?: Condition;
  availability?: Availability;
  category?: string;
  make?: string;
  min_price?: number;
  max_price?: number;
  search?: string;
}

export interface AdminListProductsQuery extends ListProductsQuery {
  is_published?: boolean;
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  currency?: Currency;
  condition: Condition;
  availability?: Availability;
  category: string;
  make: string;
  model: string;
  year: number;
  mileage?: number;
  colour?: string;
  features?: string[];
  is_published?: boolean;
}

export type UpdateProductInput = Partial<CreateProductInput>;
