import mongoose from 'mongoose';
import { AppError } from '../../../utils/error.utils';
import { createLogger } from '../../../utils/logger.utils';
import { getOrderModel } from '../../../models/order.model';
import { notifyCustomerOrderReceived, notifyAdminNewOrder } from './order.notify.service';
import { toDetail, toSummary } from './order.mappers';
import { SubmitOrderInput, OrderDetail, ListOrdersResult } from '../types/orders.types';

const logger = createLogger('order-service');

const ERRORS = {
  MIXED_CURRENCIES:  'All cart items must use the same currency',
  EMPTY_CART:        'Order must contain at least one item',
} as const;

export const submitOrder = async (
  data: SubmitOrderInput,
  userId?: string
): Promise<OrderDetail> => {
  if (data.items.length === 0) throw new AppError(ERRORS.EMPTY_CART, 400);

  const currencies = new Set(data.items.map((i) => i.currency));
  if (currencies.size > 1) throw new AppError(ERRORS.MIXED_CURRENCIES, 400);

  const currency     = data.items[0].currency;
  const total_amount = data.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const Order = await getOrderModel();

  const doc = await Order.create({
    items: data.items.map((i) => ({
      product_id: new mongoose.Types.ObjectId(i.product_id),
      name:       i.name,
      price:      i.price,
      currency:   i.currency,
      quantity:   i.quantity,
    })),
    customer:     data.customer,
    status:       'pending',
    total_amount,
    currency,
    status_history: [{ status: 'pending', changed_at: new Date() }],
    user_id: userId ? new mongoose.Types.ObjectId(userId) : undefined,
  });

  logger.info('Order submitted', { orderId: doc._id.toString(), customer: data.customer.email });

  const order = toDetail(doc);

  // Run both in parallel; each catches its own error so one failure doesn't hide the other
  await Promise.all([
    notifyCustomerOrderReceived(order, userId).catch((err: any) =>
      logger.error('Customer order notification failed', { error: err?.message, stack: err?.stack })
    ),
    notifyAdminNewOrder(order).catch((err: any) =>
      logger.error('Admin new-order notification failed', { error: err?.message, stack: err?.stack })
    ),
  ]);

  return order;
};

// ── Logged-in customer: their own order history ───────────────────────────────

export const listMyOrders = async (
  userId: string,
  page  = 1,
  limit = 20
): Promise<ListOrdersResult> => {
  const Order  = await getOrderModel();
  const skip   = (page - 1) * limit;
  const filter = { user_id: new mongoose.Types.ObjectId(userId) };

  const [docs, total] = await Promise.all([
    Order.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  return {
    orders:      docs.map(toSummary),
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  };
};
