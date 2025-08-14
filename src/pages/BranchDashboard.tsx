import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, FileText, Truck, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BranchStats {
  availableItems: number;
  pendingRequests: number;
  approvedRequests: number;
  incomingShipments: number;
  totalRequests: number;
  lowStockItems: number;
}

const BranchDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<BranchStats>({
    availableItems: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    incomingShipments: 0,
    totalRequests: 0,
    lowStockItems: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        if (!profile?.user_id) return;

        // Get branch ID first
        const { data: branchData } = await supabase
          .from('branches')
          .select('id')
          .eq('user_id', profile.user_id)
          .single();

        const promises = [
          supabase.from('items').select('*', { count: 'exact', head: true }),
          supabase.from('supply_requests').select('*', { count: 'exact', head: true }).eq('requested_by', profile.user_id).eq('status', 'pending'),
          supabase.from('supply_requests').select('*', { count: 'exact', head: true }).eq('requested_by', profile.user_id).eq('status', 'approved'),
          supabase.from('shipments').select('*', { count: 'exact', head: true }).in('status', ['shipped', 'in_transit']),
          supabase.from('supply_requests').select('*', { count: 'exact', head: true }).eq('requested_by', profile.user_id),
        ];

        if (branchData) {
          promises.push(supabase.from('inventory').select('*', { count: 'exact', head: true }).eq('branch_id', branchData.id).lt('current_stock', 10));
        } else {
          promises.push(Promise.resolve({ count: 0 }));
        }

        const results = await Promise.all(promises);
        
        setStats({
          availableItems: results[0].count || 0,
          pendingRequests: results[1].count || 0,
          approvedRequests: results[2].count || 0,
          incomingShipments: results[3].count || 0,
          totalRequests: results[4].count || 0,
          lowStockItems: results[5]?.count || 0,
        });
      } catch (error) {
        console.error('Error fetching branch stats:', error);
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

  const branchCards = [
    { title: 'Available Items', value: stats.availableItems, icon: Package, color: 'text-blue-600' },
    { title: 'Pending Requests', value: stats.pendingRequests, icon: Clock, color: 'text-orange-600' },
    { title: 'Approved Requests', value: stats.approvedRequests, icon: CheckCircle, color: 'text-green-600' },
    { title: 'Incoming Shipments', value: stats.incomingShipments, icon: Truck, color: 'text-purple-600' },
    { title: 'Total Requests', value: stats.totalRequests, icon: FileText, color: 'text-indigo-600' },
    { title: 'Low Stock Items', value: stats.lowStockItems, icon: AlertTriangle, color: 'text-red-600' },
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
                    {profile?.full_name?.charAt(0) || 'B'}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {getGreeting()}, {profile?.full_name || 'Branch Manager'}!
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      Branch Dashboard
                    </Badge>
                    {profile?.branch_name && (
                      <Badge variant="outline" className="text-xs">
                        {profile.branch_name}
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
          {branchCards.map((card, index) => (
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
                  <CheckCircle className="h-3 w-3" />
                  <span>Active</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-0 bg-gradient-to-br from-card via-card to-card/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks and actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Create New Supply Request
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Package className="h-4 w-4 mr-2" />
                View Inventory
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Truck className="h-4 w-4 mr-2" />
                Track Shipments
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-card via-card to-card/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                Request Status Overview
              </CardTitle>
              <CardDescription>Your request fulfillment metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Request Approval Rate</span>
                  <span className="text-green-600 font-semibold">85%</span>
                </div>
                <div className="relative">
                  <Progress value={85} className="h-2" />
                  <div className="absolute top-0 left-0 h-full w-[85%] bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Average Response Time</span>
                  <span className="text-blue-600 font-semibold">2.3 days</span>
                </div>
                <div className="relative">
                  <Progress value={70} className="h-2" />
                  <div className="absolute top-0 left-0 h-full w-[70%] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-0 bg-gradient-to-br from-card via-card to-card/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates on your requests and shipments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { color: 'bg-green-500', text: 'Request #REQ-001 approved by admin', time: '30 min ago', icon: '✅' },
                { color: 'bg-blue-500', text: 'Shipment #SH-003 out for delivery', time: '2 hours ago', icon: '🚚' },
                { color: 'bg-orange-500', text: 'New items added to inventory catalog', time: '4 hours ago', icon: '📦' },
                { color: 'bg-purple-500', text: 'Request #REQ-002 submitted for approval', time: '1 day ago', icon: '📋' },
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
  );
};

export default BranchDashboard;