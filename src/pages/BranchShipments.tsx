import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Truck, Check, Eye, Package } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface BranchShipment {
  id: string;
  shipment_number: string;
  status: string;
  shipped_date: string;
  estimated_delivery: string;
  actual_delivery: string;
  tracking_number: string;
  carrier: string;
  orders: {
    order_number: string;
    supply_requests: {
      request_number: string;
      title: string;
    };
  };
  order_items: {
    quantity: number;
    items: {
      name: string;
      unit: string;
    };
  }[];
}

const BranchShipments = () => {
  const { profile } = useAuth();
  const [shipments, setShipments] = useState<BranchShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<BranchShipment | null>(null);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      
      if (!profile?.user_id) return;

      // Get shipments for requests created by this branch
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          orders(
            order_number,
            supply_requests(
              request_number,
              title,
              requested_by
            ),
            order_items(
              quantity,
              items(name, unit)
            )
          )
        `)
        .eq('orders.supply_requests.requested_by', profile.user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching shipments:', error);
        return;
      }

      setShipments(data || []);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [profile]);

  const confirmDelivery = async (shipmentId: string) => {
    try {
      const { error } = await supabase
        .from('shipments')
        .update({
          status: 'delivered',
          actual_delivery: new Date().toISOString()
        })
        .eq('id', shipmentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Delivery confirmed successfully.',
      });

      setSelectedShipment(null);
      fetchShipments();
    } catch (error) {
      console.error('Error confirming delivery:', error);
      toast({
        title: 'Error',
        description: 'Failed to confirm delivery.',
        variant: 'destructive',
      });
    }
  };

  const filteredShipments = shipments.filter(shipment =>
    shipment.shipment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.orders?.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.orders?.supply_requests?.request_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'preparing':
        return 'outline';
      case 'shipped':
        return 'default';
      case 'in_transit':
        return 'secondary';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

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
          <h1 className="text-3xl font-bold">Incoming Shipments</h1>
          <p className="text-muted-foreground">
            Track your incoming shipments and confirm deliveries
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipments ({filteredShipments.length})
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shipments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredShipments.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No shipments found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms.' : 'No incoming shipments available.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment #</TableHead>
                  <TableHead>Request #</TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tracking #</TableHead>
                  <TableHead>Estimated Delivery</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">{shipment.shipment_number}</TableCell>
                    <TableCell>{shipment.orders?.supply_requests?.request_number}</TableCell>
                    <TableCell>{shipment.orders?.order_number}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(shipment.status)}>
                        {shipment.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{shipment.tracking_number || 'Not available'}</TableCell>
                    <TableCell>
                      {shipment.estimated_delivery 
                        ? new Date(shipment.estimated_delivery).toLocaleDateString()
                        : 'Not set'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedShipment(shipment)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Shipment Details - {shipment.shipment_number}</DialogTitle>
                              <DialogDescription>
                                Review shipment details and confirm delivery
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Request Title</label>
                                  <p className="text-sm text-muted-foreground">{shipment.orders?.supply_requests?.title}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Order Number</label>
                                  <p className="text-sm text-muted-foreground">{shipment.orders?.order_number}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Status</label>
                                  <Badge variant={getStatusVariant(shipment.status)}>
                                    {shipment.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Tracking Number</label>
                                  <p className="text-sm text-muted-foreground">{shipment.tracking_number || 'Not available'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Carrier</label>
                                  <p className="text-sm text-muted-foreground">{shipment.carrier || 'Not specified'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Estimated Delivery</label>
                                  <p className="text-sm text-muted-foreground">
                                    {shipment.estimated_delivery 
                                      ? new Date(shipment.estimated_delivery).toLocaleDateString()
                                      : 'Not set'
                                    }
                                  </p>
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Items in Shipment</label>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Item</TableHead>
                                      <TableHead>Quantity</TableHead>
                                      <TableHead>Unit</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {shipment.order_items?.map((item, index) => (
                                      <TableRow key={index}>
                                        <TableCell className="flex items-center gap-2">
                                          <Package className="h-4 w-4 text-muted-foreground" />
                                          {item.items.name}
                                        </TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{item.items.unit}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>

                              {shipment.status === 'in_transit' && (
                                <div className="flex justify-end">
                                  <Button
                                    onClick={() => confirmDelivery(shipment.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Confirm Delivery
                                  </Button>
                                </div>
                              )}

                              {shipment.status === 'delivered' && shipment.actual_delivery && (
                                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                                    <Check className="h-5 w-5" />
                                    <span className="font-medium">Delivery Confirmed</span>
                                  </div>
                                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                    Delivered on {new Date(shipment.actual_delivery).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {shipment.status === 'in_transit' && (
                          <Button
                            size="sm"
                            onClick={() => confirmDelivery(shipment.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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

export default BranchShipments;