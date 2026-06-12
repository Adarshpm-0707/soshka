import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ShoppingBag, ShoppingCart, Users, DollarSign, Loader2, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    productsCount: 0,
    ordersCount: 0,
    usersCount: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch products count
        const { count: productsCount, error: pError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });
        if (pError) throw pError;

        // Fetch orders count
        const { count: ordersCount, error: oError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });
        if (oError) throw oError;

        // Fetch users count
        const { count: usersCount, error: uError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        if (uError) throw uError;

        // Fetch revenue (sum order totals where status !== 'cancelled')
        const { data: ordersData, error: revError } = await supabase
          .from('orders')
          .select('total')
          .neq('status', 'cancelled');
        if (revError) throw revError;

        const totalRevenue = (ordersData || []).reduce((sum, order) => sum + Number(order.total), 0);

        setStats({
          productsCount: productsCount || 0,
          ordersCount: ordersCount || 0,
          usersCount: usersCount || 0,
          revenue: totalRevenue,
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.message || 'Failed to fetch dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
        <p className="text-sm font-semibold text-slate-500">Loading stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50/10 border border-red-500/20 text-red-500 rounded-2xl">
        <h3 className="font-bold">Error loading stats</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.revenue),
      icon: DollarSign,
      color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Total Orders',
      value: stats.ordersCount,
      icon: ShoppingCart,
      color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Active Products',
      value: stats.productsCount,
      icon: ShoppingBag,
      color: 'from-pink-500/10 to-rose-500/10 border-pink-500/20 text-[#ff2a85]',
    },
    {
      title: 'Registered Users',
      value: stats.usersCount,
      icon: Users,
      color: 'from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in text-slate-800 dark:text-white">
      <div>
        <h1 className="text-3xl font-extrabold font-sans tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Real-time metrics and administration controls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`p-6 bg-gradient-to-br ${card.color} border rounded-2xl flex items-center justify-between shadow-sm`}
            >
              <div className="space-y-1">
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                  {card.title}
                </span>
                <p className="text-2xl font-black">{card.value}</p>
              </div>
              <div className="p-3 bg-white dark:bg-black/40 rounded-xl shadow-inner">
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Decorative Quick links card */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex items-center space-x-4 shadow-sm">
        <div className="p-3 bg-red-50 dark:bg-red-950/20 text-[#ff2a85] rounded-xl shrink-0">
          <TrendingUp size={24} />
        </div>
        <div>
          <h3 className="font-bold text-sm">Store Performance & Active Campaigns</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure promotional offers and discounts dynamically. Set active start/end dates for automatically synced client banners.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
