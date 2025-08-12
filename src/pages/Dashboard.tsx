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
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">
          {getGreeting()}, {profile?.full_name || 'User'}!
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{getRoleDisplay()}</Badge>
          {userRole === 'branch' && profile?.branch_name && (
            <Badge variant="outline">{profile.branch_name}</Badge>
          )}
          {userRole === 'supplier' && profile?.supplier_company && (
            <Badge variant="outline">{profile.supplier_company}</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Analysis */}
      <RevenueChart userRole={userRole || 'branch'} />

      {/* Low Stock Alerts (Admin Only) */}
      <LowStockAlert userRole={userRole || 'branch'} />

      {userRole === 'admin' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Current system status and metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Request Processing</span>
                  <span>85%</span>
                </div>
                <Progress value={85} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Delivery Performance</span>
                  <span>92%</span>
                </div>
                <Progress value={92} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Supplier Response Rate</span>
                  <span>78%</span>
                </div>
                <Progress value={78} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates across the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>New supply request from Branch A</span>
                  <span className="text-muted-foreground ml-auto">2 min ago</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Order #PO-001 confirmed by supplier</span>
                  <span className="text-muted-foreground ml-auto">15 min ago</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Shipment #SH-003 in transit</span>
                  <span className="text-muted-foreground ml-auto">1 hour ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;