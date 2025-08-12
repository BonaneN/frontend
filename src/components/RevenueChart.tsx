import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Package, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RevenueData {
  totalRevenue: number;
  totalOrders: number;
  totalItems: number;
  averageOrderValue: number;
  monthlyRevenue: { month: string; revenue: number }[];
}

interface RevenueChartProps {
  userRole: string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ userRole }) => {
  const [revenueData, setRevenueData] = useState<RevenueData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalItems: 0,
    averageOrderValue: 0,
    monthlyRevenue: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, [userRole]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);

      // Fetch order items for revenue calculation
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          *,
          orders (
            id,
            status,
            created_at,
            suppliers (
              id,
              company_name,
              user_id
            )
          )
        `);

      if (error) {
        console.error('Error fetching revenue data:', error);
        return;
      }

      // Filter data based on user role
      let filteredData = orderItems || [];
      if (userRole === 'supplier') {
        // Suppliers only see their own revenue
        const { data: currentUser } = await supabase.auth.getUser();
        filteredData = orderItems?.filter(item => 
          item.orders?.suppliers?.user_id === currentUser.user?.id
        ) || [];
      }

      // Calculate revenue metrics
      const totalRevenue = filteredData.reduce((sum, item) => sum + Number(item.total_price), 0);
      const uniqueOrders = new Set(filteredData.map(item => item.order_id)).size;
      const totalItems = filteredData.reduce((sum, item) => sum + item.quantity, 0);
      const averageOrderValue = uniqueOrders > 0 ? totalRevenue / uniqueOrders : 0;

      // Calculate monthly revenue (last 6 months)
      const monthlyRevenue = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        const monthRevenue = filteredData
          .filter(item => item.orders?.created_at?.startsWith(monthKey))
          .reduce((sum, item) => sum + Number(item.total_price), 0);
        
        monthlyRevenue.push({ month: monthName, revenue: monthRevenue });
      }

      setRevenueData({
        totalRevenue,
        totalOrders: uniqueOrders,
        totalItems,
        averageOrderValue,
        monthlyRevenue
      });
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-8 bg-muted rounded w-3/4"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenueData.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {userRole === 'admin' ? 'All time revenue' : 'Your total revenue'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueData.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Completed orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueData.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Total quantity sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenueData.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Per order average
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {revenueData.monthlyRevenue.map((month, index) => {
              const maxRevenue = Math.max(...revenueData.monthlyRevenue.map(m => m.revenue));
              const width = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center space-x-4">
                  <div className="min-w-[80px] text-sm font-medium">{month.month}</div>
                  <div className="flex-1 bg-muted rounded-full h-3 relative overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <div className="min-w-[100px] text-sm text-right font-medium">
                    {formatCurrency(month.revenue)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueChart;