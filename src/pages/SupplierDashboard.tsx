import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, Truck, TrendingUp, DollarSign, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface SupplierStats {
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  totalRevenue: number;
  activeShipments: number;
  completedDeliveries: number;
}

const SupplierDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<SupplierStats>({
    pendingOrders: 0,
    confirmedOrders: 0,
    shippedOrders: 0,
    totalRevenue: 0,
    activeShipments: 0,
    completedDeliveries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        if (!profile?.user_id) return;

        // Get supplier ID first
        const { data: supplierData } = await supabase
          .from('suppliers')
          .select('id')
          .eq('user_id', profile.user_id)
          .single();

        if (!supplierData) return;

        const promises = [
          supabase.from('orders').select('*', { count: 'exact', head: true }).eq('supplier_id', supplierData.id).eq('status', 'pending'),
          supabase.from('orders').select('*', { count: 'exact', head: true }).eq('supplier_id', supplierData.id).eq('status', 'confirmed'),
          supabase.from('orders').select('*', { count: 'exact', head: true }).eq('supplier_id', supplierData.id).eq('status', 'shipped'),
          supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('status', 'in_transit'),
          supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('status', 'delivered'),
        ];

        const results = await Promise.all(promises);
        
        setStats({
          pendingOrders: results[0].count || 0,
          confirmedOrders: results[1].count || 0,
          shippedOrders: results[2].count || 0,
          totalRevenue: 0, // Will be calculated from order totals
          activeShipments: results[3].count || 0,
          completedDeliveries: results[4].count || 0,
        });
      } catch (error) {
        console.error('Error fetching supplier stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const supplierCards = [
    { title: 'Pending Orders', value: stats.pendingOrders, icon: Package, color: 'text-orange-600' },
    { title: 'Confirmed Orders', value: stats.confirmedOrders, icon: ShoppingCart, color: 'text-green-600' },
    { title: 'Shipped Orders', value: stats.shippedOrders, icon: Truck, color: 'text-blue-600' },
    { title: 'Active Shipments', value: stats.activeShipments, icon: Truck, color: 'text-purple-600' },
    { title: 'Completed Deliveries', value: stats.completedDeliveries, icon: TrendingUp, color: 'text-emerald-600' },
    { title: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-pink-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="space-y-8 p-6">
        {/* Modern Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-border/50 p-8">
          <div className="relative z-10">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">
                    {profile?.full_name?.charAt(0) || 'S'}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {getGreeting()}, {profile?.full_name || 'Supplier'}!
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      Supplier Dashboard
                    </Badge>
                    {profile?.supplier_company && (
                      <Badge variant="outline" className="text-xs">
                        {profile.supplier_company}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent" />
        </div>

        {/* Modern Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {supplierCards.map((card, index) => (
            <Card key={index} className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br from-background to-muted/50`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold tracking-tight mb-1">
                  {card.value}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>Active</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Orders Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-0 bg-gradient-to-br from-card via-card to-card/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                </div>
                Order Performance
              </CardTitle>
              <CardDescription>Your order fulfillment metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Order Processing</span>
                  <span className="text-green-600 font-semibold">92%</span>
                </div>
                <div className="relative">
                  <Progress value={92} className="h-2" />
                  <div className="absolute top-0 left-0 h-full w-[92%] bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">On-Time Delivery</span>
                  <span className="text-blue-600 font-semibold">88%</span>
                </div>
                <div className="relative">
                  <Progress value={88} className="h-2" />
                  <div className="absolute top-0 left-0 h-full w-[88%] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Customer Satisfaction</span>
                  <span className="text-purple-600 font-semibold">95%</span>
                </div>
                <div className="relative">
                  <Progress value={95} className="h-2" />
                  <div className="absolute top-0 left-0 h-full w-[95%] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-card via-card to-card/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                Recent Activity
              </CardTitle>
              <CardDescription>Latest order updates and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { color: 'bg-green-500', text: 'Order #PO-001 confirmed', time: '15 min ago', icon: '✅' },
                  { color: 'bg-blue-500', text: 'Shipment #SH-003 dispatched', time: '1 hour ago', icon: '🚚' },
                  { color: 'bg-orange-500', text: 'New order #PO-002 received', time: '2 hours ago', icon: '📋' },
                  { color: 'bg-purple-500', text: 'Payment for order #PO-001 processed', time: '4 hours ago', icon: '💰' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-muted/50 to-transparent hover:from-muted hover:to-muted/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-lg">{activity.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.text}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                    <div className={`w-2 h-2 ${activity.color} rounded-full`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboard;