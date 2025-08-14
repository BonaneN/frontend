import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Download, DollarSign, Package, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OrderReport {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  expected_delivery: string;
  actual_delivery: string;
  total_amount: number;
  payment_status: string;
  payment_date: string;
  supply_requests: {
    request_number: string;
    branch_name: string;
    requested_by: string;
  };
  order_items: {
    quantity: number;
    unit_price: number;
    total_price: number;
    items: {
      name: string;
      unit: string;
    };
  }[];
}

const SupplierReports = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<OrderReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  const fetchOrderReports = async () => {
    try {
      setLoading(true);
      
      // Get supplier ID first
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', profile?.user_id)
        .single();

      if (!supplierData) return;

      let query = supabase
        .from('orders')
        .select(`
          *,
          supply_requests(
            request_number,
            branches(branch_name),
            profiles(full_name)
          ),
          order_items(
            quantity,
            unit_price,
            total_price,
            items(name, unit)
          )
        `)
        .eq('supplier_id', supplierData.id)
        .in('status', ['confirmed', 'shipped', 'delivered']);

      // Apply date filter
      if (dateRange !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (dateRange) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'quarter':
            startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        }
        
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching order reports:', error);
        return;
      }

      // Calculate totals and add payment info (mock data for now)
      const enrichedData = data?.map(order => ({
        ...order,
        total_amount: order.order_items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0,
        payment_status: Math.random() > 0.3 ? 'paid' : 'pending', // Mock payment status
        payment_date: Math.random() > 0.3 ? new Date().toISOString() : null,
      })) || [];

      setOrders(enrichedData);
    } catch (error) {
      console.error('Error fetching order reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.user_id) {
      fetchOrderReports();
    }
  }, [profile, dateRange]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supply_requests?.request_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supply_requests?.branch_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'shipped':
        return 'secondary';
      case 'delivered':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'destructive';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const paidOrders = filteredOrders.filter(order => order.payment_status === 'paid').length;
  const pendingPayments = filteredOrders.filter(order => order.payment_status === 'pending').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Order Reports</h1>
          <p className="text-muted-foreground">
            View confirmed and shipped orders with payment details
          </p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/50 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-background to-muted/50">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight mb-1">
              ${totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From {filteredOrders.length} orders
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/50 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Orders
            </CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-background to-muted/50">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight mb-1">
              {paidOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              Payment received
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/50 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payments
            </CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-background to-muted/50">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight mb-1">
              {pendingPayments}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Order Reports ({filteredOrders.length})
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms.' : 'No order reports available.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Request #</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Delivery Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.supply_requests?.request_number}</TableCell>
                    <TableCell>{order.supply_requests?.branch_name}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>${order.total_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={getPaymentStatusVariant(order.payment_status)}>
                        {order.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {order.actual_delivery
                        ? new Date(order.actual_delivery).toLocaleDateString()
                        : order.expected_delivery
                        ? new Date(order.expected_delivery).toLocaleDateString()
                        : 'Not set'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierReports;