import { OrderDetail, OrderSummary } from '../types/orders.types';

// Accepts both hydrated Mongoose documents and .lean() plain objects —
// typed `any` like the rest of this codebase's mappers for that reason.
export const toSummary = (doc: any): OrderSummary => ({
  id:           doc._id.toString(),
  customer:     { name: doc.customer.name, email: doc.customer.email, phone: doc.customer.phone },
  status:       doc.status,
  item_count:   doc.items.length,
  total_amount: doc.total_amount,
  currency:     doc.currency,
  created_at:   doc.created_at,
});

export const toDetail = (doc: any): OrderDetail => ({
  id:           doc._id.toString(),
  items:        doc.items.map((i: any) => ({
    product_id: i.product_id.toString(),
    name:       i.name,
    price:      i.price,
    currency:   i.currency,
    quantity:   i.quantity,
  })),
  customer:     doc.customer,
  status:       doc.status,
  total_amount: doc.total_amount,
  currency:     doc.currency,
  status_history: (doc.status_history ?? []).map((h: any) => ({
    status:     h.status,
    changed_by: h.changed_by?.toString(),
    notes:      h.notes,
    changed_at: h.changed_at,
  })),
  user_id:    doc.user_id?.toString(),
  created_at: doc.created_at,
  updated_at: doc.updated_at,
});
