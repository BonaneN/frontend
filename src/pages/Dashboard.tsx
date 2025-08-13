import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, Truck, AlertTriangle, TrendingUp, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import RevenueChart from '@/components/RevenueChart';
import LowStockAlert from '@/components/LowStockAlert';

interface DashboardStats {
  totalItems: number;
  pendingRequests: number;
  activeOrders: number;
  inTransitShipments: number;
  totalBranches: number;
  totalSuppliers: number;
}

const Dashboard = () => {
  const { userRole, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    pendingRequests: 0,
    activeOrders: 0,
    inTransitShipments: 0,
    totalBranches: 0,
    totalSuppliers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch different stats based on role
        const promises = [];
        
        if (userRole === 'admin') {
          promises.push(
            supabase.from('items').select('*', { count: 'exact', head: true }),
            supabase.from('supply_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending', 'confirmed']),
            supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('status', 'in_transit'),
            supabase.from('branches').select('*', { count: 'exact', head: true }),
            supabase.from('suppliers').select('*', { count: 'exact', head: true })
          );
        } else if (userRole === 'branch') {
          promises.push(
            supabase.from('items').select('*', { count: 'exact', head: true }),
            supabase.from('supply_requests').select('*', { count: 'exact', head: true }).eq('requested_by', profile?.user_id).eq('status', 'pending'),
            supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending', 'confirmed']),
            supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('status', 'in_transit')
          );
        } else if (userRole === 'supplier') {
          promises.push(
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('supplier_id', profile?.supplier_id).in('status', ['pending', 'confirmed']),
            supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('status', 'in_transit')
          );
        }

        const results = await Promise.all(promises);
        
        if (userRole === 'admin') {
          setStats({
            totalItems: results[0].count || 0,
            pendingRequests: results[1].count || 0,
            activeOrders: results[2].count || 0,
            inTransitShipments: results[3].count || 0,
            totalBranches: results[4].count || 0,
            totalSuppliers: results[5].count || 0,
          });
        } else if (userRole === 'branch') {
          setStats({
            totalItems: results[0].count || 0,
            pendingRequests: results[1].count || 0,
            activeOrders: results[2].count || 0,
            inTransitShipments: results[3].count || 0,
            totalBranches: 0,
            totalSuppliers: 0,
          });
        } else if (userRole === 'supplier') {
          setStats({
            totalItems: 0,
            pendingRequests: 0,
            activeOrders: results[0].count || 0,
            inTransitShipments: results[1].count || 0,
            totalBranches: 0,
            totalSuppliers: 0,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userRole && profile) {
      fetchStats();
    }
  }, [userRole, profile]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleDisplay = () => {
    switch (userRole) {
      case 'admin':
        return 'Central Administrator';
      case 'branch':
        return 'Branch Manager';
      case 'supplier':
        return 'Supplier';
      default:
        return 'User';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const adminCards = [
    { title: 'Total Items', value: stats.totalItems, icon: Package, color: 'text-blue-600' },
    { title: 'Pending Requests', value: stats.pendingRequests, icon: AlertTriangle, color: 'text-orange-600' },
    { title: 'Active Orders', value: stats.activeOrders, icon: ShoppingCart, color: 'text-green-600' },
    { title: 'Shipments in Transit', value: stats.inTransitShipments, icon: Truck, color: 'text-purple-600' },
    { title: 'Total Branches', value: stats.totalBranches, icon: Building2, color: 'text-indigo-600' },
    { title: 'Total Suppliers', value: stats.totalSuppliers, icon: TrendingUp, color: 'text-pink-600' },
  ];

  const branchCards = [
    { title: 'Available Items', value: stats.totalItems, icon: Package, color: 'text-blue-600' },
    { title: 'My Pending Requests', value: stats.pendingRequests, icon: AlertTriangle, color: 'text-orange-600' },
    { title: 'Orders in Progress', value: stats.activeOrders, icon: ShoppingCart, color: 'text-green-600' },
    { title: 'Incoming Shipments', value: stats.inTransitShipments, icon: Truck, color: 'text-purple-600' },
  ];

  const supplierCards = [
    { title: 'Active Orders', value: stats.activeOrders, icon: ShoppingCart, color: 'text-green-600' },
    { title: 'Shipments in Transit', value: stats.inTransitShipments, icon: Truck, color: 'text-purple-600' },
  ];

  const getCards = () => {
    switch (userRole) {
      case 'admin':
        return adminCards;
      case 'branch':
        return branchCards;
      case 'supplier':
        return supplierCards;
      default:
        return [];
    }
  };

  const cards = getCards();

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
                    {profile?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {getGreeting()}, {profile?.full_name || 'User'}!
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {getRoleDisplay()}
                    </Badge>
                    {userRole === 'branch' && profile?.branch_name && (
                      <Badge variant="outline" className="text-xs">
                        {profile.branch_name}
                      </Badge>
                    )}
                    {userRole === 'supplier' && profile?.supplier_company && (
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, index) => (
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

      {/* Revenue Analysis */}
      <RevenueChart userRole={userRole || 'branch'} />

      {/* Low Stock Alerts (Admin Only) */}
      <LowStockAlert userRole={userRole || 'branch'} />

        {userRole === 'admin' && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 bg-gradient-to-br from-card via-card to-card/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  System Performance
                </CardTitle>
                <CardDescription>Real-time system metrics and KPIs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Request Processing</span>
                    <span className="text-green-600 font-semibold">85%</span>
                  </div>
                  <div className="relative">
                    <Progress value={85} className="h-2" />
                    <div className="absolute top-0 left-0 h-full w-[85%] bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Delivery Performance</span>
                    <span className="text-blue-600 font-semibold">92%</span>
                  </div>
                  <div className="relative">
                    <Progress value={92} className="h-2" />
                    <div className="absolute top-0 left-0 h-full w-[92%] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Supplier Response</span>
                    <span className="text-orange-600 font-semibold">78%</span>
                  </div>
                  <div className="relative">
                    <Progress value={78} className="h-2" />
                    <div className="absolute top-0 left-0 h-full w-[78%] bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-card via-card to-card/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20">
                    <Building2 className="h-4 w-4 text-purple-600" />
                  </div>
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest system updates and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { color: 'bg-green-500', text: 'New supply request submitted', time: '2 min ago', icon: '📋' },
                    { color: 'bg-blue-500', text: 'Order #PO-001 confirmed', time: '15 min ago', icon: '✅' },
                    { color: 'bg-orange-500', text: 'Shipment #SH-003 in transit', time: '1 hour ago', icon: '🚚' },
                    { color: 'bg-purple-500', text: 'Budget report generated', time: '2 hours ago', icon: '📊' },
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
        )}
      </div>
    </div>
  );
};

export default Dashboard;