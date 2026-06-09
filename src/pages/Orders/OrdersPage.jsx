import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { orderService } from '../../services/orderService';
import SectionTitle from '../../components/Reusable/SectionTitle';
import Loader from '../../components/Reusable/Loader';
import Badge from '../../components/Reusable/Badge';
import Button from '../../components/Reusable/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { ShoppingBag, Calendar, ArrowRight } from 'lucide-react';

const OrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const data = await orderService.getOrders(user.id);
        setOrders(data);
      } catch (err) {
        setError(err.message || 'Error fetching orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  if (loading) return <Loader fullScreen text="Loading orders history..." />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-905 transition-colors duration-300">
      {/* Required SectionTitle */}
      <SectionTitle
        title="My Orders"
        subtitle="Manage your purchases, download order receipts, and track delivery status."
        align="left"
      />

      {error ? (
        <div className="p-8 text-center text-red-500 font-semibold text-sm">
          Failed to load orders: {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full mb-4">
            <ShoppingBag size={48} />
          </div>
          <h3 className="text-xl font-bold text-slate-850 dark:text-white mb-2 font-sans">
            No orders placed yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6 text-sm">
            Looks like you haven't made any purchases yet. Head over to our catalog to checkout our items!
          </p>
          <Button onClick={() => navigate('/products')}>Browse Products</Button>
        </div>
      ) : (
        <div className="space-y-4 mt-6">
          {orders.map((order) => {
            const dateStr = new Date(order.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            const itemCount = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

            return (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm gap-4 cursor-pointer hover:border-primary-500/50 dark:hover:border-primary-500/50 transition duration-200 group"
              >
                {/* Order meta info */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
                    <Calendar size={14} />
                    <span>{dateStr}</span>
                    <span>•</span>
                    <span>ID: {order.id.substring(0, 8)}...</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-850 dark:text-white">
                    {itemCount} {itemCount === 1 ? 'Item' : 'Items'} Purchased
                  </h4>
                  <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Grand Total: <span className="text-slate-800 dark:text-white font-extrabold">{formatCurrency(order.total)}</span>
                  </div>
                </div>

                {/* Status and Action Link */}
                <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-3 md:pt-0">
                  <Badge status={order.status} />
                  <span className="p-2 text-slate-400 group-hover:text-primary-650 group-hover:translate-x-1.5 transition-all duration-200">
                    <ArrowRight size={18} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
