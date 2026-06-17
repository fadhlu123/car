export type OrderStatus = 'pending' | 'contacted' | 'completed' | 'cancelled';

// Valid next statuses per current status
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:   ['contacted', 'cancelled'],
  contacted: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  email: string;
  notes?: string;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  changed_by?: string;
  notes?: string;
  changed_at: Date;
}

export interface OrderSummary {
  id: string;
  customer: Pick<OrderCustomer, 'name' | 'email' | 'phone'>;
  status: OrderStatus;
  item_count: number;
  total_amount: number;
  currency: string;
  created_at: Date;
}

export interface OrderDetail {
  id: string;
  items: OrderItem[];
  customer: OrderCustomer;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  status_history: StatusHistoryEntry[];
  user_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ListOrdersResult {
  orders: OrderSummary[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface SubmitOrderInput {
  items: Array<{
    product_id: string;
    name: string;
    price: number;
    currency: string;
    quantity: number;
  }>;
  customer: {
    name: string;
    phone: string;
    email: string;
    notes?: string;
  };
}

export interface AdminListOrdersQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  email?: string;
  date_from?: string;
  date_to?: string;
}
