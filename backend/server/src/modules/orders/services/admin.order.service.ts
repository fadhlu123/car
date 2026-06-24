import mongoose from 'mongoose';
import { AppError } from '../../../utils/error.utils';
import { createLogger } from '../../../utils/logger.utils';
import { getOrderModel } from '../../../models/order.model';
import { notifyCustomerStatusUpdate } from './order.notify.service';
import { toDetail, toSummary } from './order.mappers';
import {
  AdminListOrdersQuery,
  ListOrdersResult,
  OrderDetail,
  OrderStatus,
  STATUS_TRANSITIONS,
} from '../types/orders.types';

const logger = createLogger('admin-order-service');

const ERRORS = {
  NOT_FOUND:          'Order not found',
  INVALID_ID:         'Invalid order ID',
  INVALID_TRANSITION: (from: string, to: string) =>
    `Cannot move order from '${from}' to '${to}'`,
} as const;

export const listOrders = async (query: AdminListOrdersQuery): Promise<ListOrdersResult> => {
  const Order = await getOrderModel();
  const page  = Math.max(1, query.page  ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const skip  = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.email)  filter['customer.email'] = new RegExp(query.email, 'i');
  if (query.date_from || query.date_to) {
    const dateFilter: Record<string, Date> = {};
    if (query.date_from) dateFilter.$gte = new Date(query.date_from);
    if (query.date_to)   dateFilter.$lte = new Date(query.date_to);
    filter.created_at = dateFilter;
  }

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

export const getOrder = async (id: string): Promise<OrderDetail> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(ERRORS.INVALID_ID, 400);
  const Order = await getOrderModel();
  const doc   = await Order.findById(id);
  if (!doc) throw new AppError(ERRORS.NOT_FOUND, 404);
  return toDetail(doc);
};

export const updateOrderStatus = async (
  id: string,
  newStatus: OrderStatus,
  adminId: string,
  notes?: string
): Promise<OrderDetail> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(ERRORS.INVALID_ID, 400);

  const Order = await getOrderModel();
  const doc   = await Order.findById(id);
  if (!doc) throw new AppError(ERRORS.NOT_FOUND, 404);

  const allowed = STATUS_TRANSITIONS[doc.status];
  if (!allowed.includes(newStatus)) {
    throw new AppError(ERRORS.INVALID_TRANSITION(doc.status, newStatus), 400);
  }

  const previousStatus = doc.status;

  doc.status = newStatus;
  doc.status_history.push({
    status:     newStatus,
    changed_by: new mongoose.Types.ObjectId(adminId) as any,
    notes:      notes ?? undefined,
    changed_at: new Date(),
  } as any);

  await doc.save();

  logger.info('Order status updated', { orderId: id, from: previousStatus, to: newStatus, adminId });

  const order = toDetail(doc);

  try {
    await notifyCustomerStatusUpdate(order, previousStatus, doc.user_id?.toString());
  } catch (err: any) {
    logger.error('Status update notification failed', { error: err?.message, stack: err?.stack });
  }

  return order;
};
