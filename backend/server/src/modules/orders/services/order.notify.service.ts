import { dispatch } from '../../notifications/services/notification.dispatcher';
import { OrderDetail } from '../types/orders.types';

const toSnapshot = (order: OrderDetail) => ({
  id:           order.id,
  customer:     order.customer,
  total_amount: order.total_amount,
  currency:     order.currency,
  status:       order.status,
  items:        order.items,
});

export const notifyCustomerOrderReceived = (order: OrderDetail, userId?: string): Promise<void> =>
  dispatch({ type: 'order_received', order: toSnapshot(order), userId });

export const notifyAdminNewOrder = (order: OrderDetail): Promise<void> =>
  dispatch({ type: 'new_order_admin', order: toSnapshot(order) });

export const notifyCustomerStatusUpdate = (
  order:          OrderDetail,
  previousStatus: string,
  userId?:        string
): Promise<void> =>
  dispatch({ type: 'order_status_update', order: toSnapshot(order), previousStatus, userId });
