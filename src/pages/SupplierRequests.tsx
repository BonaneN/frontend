import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Eye, Check, X, AlertTriangle } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface SupplierRequest {
  id: string;
  request_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  requested_date: string;
  required_date: string;
  branch_name?: string;
  request_items: {
    id: string;
    quantity: number;
    specifications: string;
    notes: string;
    items: {
      name: string;
      unit: string;
    };
  }[];
}

const SupplierRequests = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<SupplierRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<SupplierRequest | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      // Get supplier ID first
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', profile?.user_id)
        .single();

      if (!supplierData) return;

      // Fetch supply requests that need supplier attention
      const { data, error } = await supabase
        .from('supply_requests')
        .select(`
          *,
          request_items(
            id,
            quantity,
            specifications,
            notes,
            items(name, unit)
          )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
        return;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.user_id) {
      fetchRequests();
    }
  }, [profile]);

  const handleAction = async (requestId: string, action: 'confirm' | 'modify' | 'deny') => {
    setActionLoading(true);
    try {
      let newStatus = action === 'confirm' ? 'confirmed' : action === 'modify' ? 'modified' : 'denied';
      
      const { error } = await supabase
        .from('supply_requests')
        .update({
          status: newStatus,
          notes: responseNotes || null
        })
        .eq('id', requestId);

      if (error) throw error;

      // If confirmed, create an order
      if (action === 'confirm') {
        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            request_id: requestId,
            supplier_id: (await supabase.from('suppliers').select('id').eq('user_id', profile?.user_id).single()).data?.id,
            order_number: `ORD-${Date.now()}`,
            status: 'pending'
          });

        if (orderError) throw orderError;
      }

      toast({
        title: 'Success',
        description: `Request ${action}ed successfully.`,
      });

      setResponseNotes('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: 'Error',
        description: 'Failed to update request.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter(request =>
    request.request_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.branch_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'confirmed':
        return 'secondary';
      case 'modified':
        return 'outline';
      case 'denied':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
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
          <h1 className="text-3xl font-bold">Supply Requests</h1>
          <p className="text-muted-foreground">
            Review and respond to supply requests from branches
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pending Requests ({filteredRequests.length})
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No requests found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms.' : 'No supply requests available.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Required Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.request_number}</TableCell>
                    <TableCell>{request.title}</TableCell>
                    <TableCell>{request.branch_name}</TableCell>
                    <TableCell>
                      <Badge variant={getPriorityVariant(request.priority)}>
                        {request.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(request.status)}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(request.required_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Request Details - {request.request_number}</DialogTitle>
                              <DialogDescription>
                                Review request details and provide your response
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Title</label>
                                  <p className="text-sm text-muted-foreground">{request.title}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Branch</label>
                                  <p className="text-sm text-muted-foreground">{request.branch_name}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Priority</label>
                                  <Badge variant={getPriorityVariant(request.priority)}>
                                    {request.priority}
                                  </Badge>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Required Date</label>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(request.required_date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Description</label>
                                <p className="text-sm text-muted-foreground">{request.description}</p>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Requested Items</label>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Item</TableHead>
                                      <TableHead>Quantity</TableHead>
                                      <TableHead>Unit</TableHead>
                                      <TableHead>Specifications</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {request.request_items?.map((item) => (
                                      <TableRow key={item.id}>
                                        <TableCell>{item.items.name}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{item.items.unit}</TableCell>
                                        <TableCell>{item.specifications || 'None'}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Response Notes</label>
                                <Textarea
                                  placeholder="Add notes about your response..."
                                  value={responseNotes}
                                  onChange={(e) => setResponseNotes(e.target.value)}
                                  className="mt-2"
                                />
                              </div>

                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="destructive"
                                  onClick={() => handleAction(request.id, 'deny')}
                                  disabled={actionLoading}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Deny
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleAction(request.id, 'modify')}
                                  disabled={actionLoading}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Request Modification
                                </Button>
                                <Button
                                  onClick={() => handleAction(request.id, 'confirm')}
                                  disabled={actionLoading}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Confirm Order
                                </Button>
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

export default SupplierRequests;