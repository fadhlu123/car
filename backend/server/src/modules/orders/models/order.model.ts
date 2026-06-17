import mongoose, { Schema, Document, Types } from 'mongoose';
import { databaseManager } from '../../../configs/database.config';
import { OrderStatus } from '../types/orders.types';

export const ORDERS_DB = 'auto-majid-orders';

interface IStatusHistoryEntry {
  status: OrderStatus;
  changed_by?: Types.ObjectId;
  notes?: string;
  changed_at: Date;
}

interface IOrderItem {
  product_id: Types.ObjectId;
  name: string;
  price: number;
  currency: string;
  quantity: number;
}

interface IOrderCustomer {
  name: string;
  phone: string;
  email: string;
  notes?: string;
}

export interface IOrder extends Document {
  items: IOrderItem[];
  customer: IOrderCustomer;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  status_history: IStatusHistoryEntry[];
  user_id?: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const StatusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status:     { type: String, required: true, enum: ['pending', 'contacted', 'completed', 'cancelled'] },
    changed_by: { type: Schema.Types.ObjectId },
    notes:      { type: String, maxlength: 500 },
    changed_at: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product_id: { type: Schema.Types.ObjectId, required: true },
    name:       { type: String, required: true, maxlength: 200 },
    price:      { type: Number, required: true, min: 0 },
    currency:   { type: String, required: true },
    quantity:   { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const OrderCustomerSchema = new Schema<IOrderCustomer>(
  {
    name:  { type: String, required: true, maxlength: 100 },
    phone: { type: String, required: true, maxlength: 20 },
    email: { type: String, required: true, maxlength: 200 },
    notes: { type: String, maxlength: 1000 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    items:          { type: [OrderItemSchema], required: true },
    customer:       { type: OrderCustomerSchema, required: true },
    status:         { type: String, required: true, enum: ['pending', 'contacted', 'completed', 'cancelled'], default: 'pending' },
    total_amount:   { type: Number, required: true, min: 0 },
    currency:       { type: String, required: true },
    status_history: { type: [StatusHistorySchema], default: [] },
    user_id:        { type: Schema.Types.ObjectId },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

OrderSchema.index({ status: 1, created_at: -1 });
OrderSchema.index({ 'customer.email': 1 });
OrderSchema.index({ user_id: 1 });

let _Order: mongoose.Model<IOrder> | null = null;

export const getOrderModel = async (): Promise<mongoose.Model<IOrder>> => {
  if (_Order) return _Order;
  const conn = await databaseManager.getConnection(ORDERS_DB);
  _Order = conn.model<IOrder>('Order', OrderSchema);
  return _Order;
};
