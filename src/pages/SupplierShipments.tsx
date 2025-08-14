import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Truck, Plus, Edit, Eye } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface Shipment {
  id: string;
  shipment_number: string;
  status: string;
  shipped_date: string;
  estimated_delivery: string;
  actual_delivery: string;
  tracking_number: string;
  carrier: string;
  notes: string;
  orders: {
    order_number: string;
    supply_requests: {
      request_number: string;
      branch_name: string;
    };
  };
}

const SupplierShipments = () => {
  const { profile } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [editMode, setEditMode] = useState(false);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      
      // Get supplier ID first
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', profile?.user_id)
        .single();

      if (!supplierData) return;

      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          orders(
            order_number,
            supply_requests(
              request_number,
              branches(branch_name)
            )
          )
        `)
        .eq('orders.supplier_id', supplierData.id)
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
    if (profile?.user_id) {
      fetchShipments();
    }
  }, [profile]);

  const updateShipmentStatus = async (shipmentId: string, status: string, trackingNumber?: string, notes?: string) => {
    try {
      const updateData: any = { status };
      
      if (trackingNumber) updateData.tracking_number = trackingNumber;
      if (notes) updateData.notes = notes;
      if (status === 'shipped' && !selectedShipment?.shipped_date) {
        updateData.shipped_date = new Date().toISOString();
      }
      if (status === 'delivered') {
        updateData.actual_delivery = new Date().toISOString();
      }

      const { error } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', shipmentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Shipment updated successfully.',
      });

      setEditMode(false);
      setSelectedShipment(null);
      fetchShipments();
    } catch (error) {
      console.error('Error updating shipment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update shipment.',
        variant: 'destructive',
      });
    }
  };

  const filteredShipments = shipments.filter(shipment =>
    shipment.shipment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.orders?.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold">Shipment Management</h1>
          <p className="text-muted-foreground">
            Track and manage your shipments
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
                {searchTerm ? 'Try adjusting your search terms.' : 'No shipments available.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment #</TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Branch</TableHead>
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
                    <TableCell>{shipment.orders?.order_number}</TableCell>
                    <TableCell>{shipment.orders?.supply_requests?.branch_name}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(shipment.status)}>
                        {shipment.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{shipment.tracking_number || 'Not assigned'}</TableCell>
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
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Shipment Details - {shipment.shipment_number}</DialogTitle>
                              <DialogDescription>
                                View and update shipment information
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Order Number</Label>
                                  <p className="text-sm text-muted-foreground">{shipment.orders?.order_number}</p>
                                </div>
                                <div>
                                  <Label>Status</Label>
                                  <Badge variant={getStatusVariant(shipment.status)}>
                                    {shipment.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <div>
                                  <Label>Tracking Number</Label>
                                  <Input
                                    defaultValue={shipment.tracking_number || ''}
                                    placeholder="Enter tracking number"
                                    onChange={(e) => {
                                      if (selectedShipment) {
                                        setSelectedShipment({
                                          ...selectedShipment,
                                          tracking_number: e.target.value
                                        });
                                      }
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label>Carrier</Label>
                                  <Input
                                    defaultValue={shipment.carrier || ''}
                                    placeholder="Enter carrier name"
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <Label>Notes</Label>
                                <Textarea
                                  defaultValue={shipment.notes || ''}
                                  placeholder="Add shipment notes..."
                                  onChange={(e) => {
                                    if (selectedShipment) {
                                      setSelectedShipment({
                                        ...selectedShipment,
                                        notes: e.target.value
                                      });
                                    }
                                  }}
                                />
                              </div>

                              <div className="flex gap-2 justify-end">
                                {shipment.status === 'preparing' && (
                                  <Button
                                    onClick={() => updateShipmentStatus(
                                      shipment.id, 
                                      'shipped', 
                                      selectedShipment?.tracking_number,
                                      selectedShipment?.notes
                                    )}
                                  >
                                    Mark as Shipped
                                  </Button>
                                )}
                                {shipment.status === 'shipped' && (
                                  <Button
                                    onClick={() => updateShipmentStatus(
                                      shipment.id, 
                                      'in_transit',
                                      selectedShipment?.tracking_number,
                                      selectedShipment?.notes
                                    )}
                                  >
                                    Mark in Transit
                                  </Button>
                                )}
                                {shipment.status === 'in_transit' && (
                                  <Button
                                    onClick={() => updateShipmentStatus(
                                      shipment.id, 
                                      'delivered',
                                      selectedShipment?.tracking_number,
                                      selectedShipment?.notes
                                    )}
                                  >
                                    Mark as Delivered
                                  </Button>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
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

export default SupplierShipments;