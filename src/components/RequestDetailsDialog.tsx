import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, XCircle, Edit, Clock, Package } from 'lucide-react';

interface RequestDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string | null;
  onSuccess: () => void;
}

interface RequestDetails {
  id: string;
  request_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  requested_date: string;
  required_date: string;
  notes: string;
  branches: { branch_name: string } | null;
  profiles: { full_name: string } | null;
  request_items: Array<{
    id: string;
    quantity: number;
    specifications: string;
    notes: string;
    items: { name: string; unit: string } | null;
  }>;
}

const RequestDetailsDialog = ({ open, onOpenChange, requestId, onSuccess }: RequestDetailsDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [showReasonField, setShowReasonField] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'modify' | null>(null);
  const { userRole, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && requestId) {
      fetchRequestDetails();
    }
  }, [open, requestId]);

  const fetchRequestDetails = async () => {
    if (!requestId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('supply_requests')
        .select(`
          *,
          branches(branch_name),
          profiles(full_name),
          request_items(
            id,
            quantity,
            specifications,
            notes,
            items(name, unit)
          )
        `)
        .eq('id', requestId)
        .single();

      if (error) {
        console.error('Error fetching request details:', error);
        return;
      }

      setRequest(data as any);
    } catch (error) {
      console.error('Error fetching request details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject' | 'modify') => {
    if (!request || !profile?.user_id) return;

    if ((action === 'reject' || action === 'modify') && !actionReason.trim()) {
      setActionType(action);
      setShowReasonField(true);
      return;
    }

    try {
      setActionLoading(true);
      
      const updateData: any = {
        status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'modified',
        updated_at: new Date().toISOString(),
      };

      if (action === 'approve') {
        updateData.approved_by = profile.user_id;
        updateData.approved_date = new Date().toISOString();
      }

      if (actionReason.trim()) {
        updateData.notes = request.notes ? 
          `${request.notes}\n\n${action.toUpperCase()}: ${actionReason}` : 
          `${action.toUpperCase()}: ${actionReason}`;
      }

      const { error } = await supabase
        .from('supply_requests')
        .update(updateData)
        .eq('id', request.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `Request ${action}d successfully`,
      });

      setActionReason('');
      setShowReasonField(false);
      setActionType(null);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || `Failed to ${action} request`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const submitWithReason = () => {
    if (actionType && actionReason.trim()) {
      handleAction(actionType);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a reason",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'modified':
        return <Edit className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'modified':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!request) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Request Details - {request.request_number}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Request Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{request.title}</h3>
              <div className="flex gap-2">
                <Badge variant={getPriorityVariant(request.priority)}>
                  {request.priority} priority
                </Badge>
                <div className="flex items-center gap-2">
                  {getStatusIcon(request.status)}
                  <Badge variant={getStatusVariant(request.status)}>
                    {request.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Branch:</span> {request.branches?.branch_name}
              </div>
              <div>
                <span className="font-medium">Requested by:</span> {request.profiles?.full_name}
              </div>
              <div>
                <span className="font-medium">Requested date:</span> {new Date(request.requested_date).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Required date:</span> {request.required_date ? new Date(request.required_date).toLocaleDateString() : 'Not specified'}
              </div>
            </div>

            {request.description && (
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {request.description}
                </p>
              </div>
            )}
          </div>

          {/* Request Items */}
          <div>
            <h4 className="font-medium mb-3">Requested Items</h4>
            <div className="space-y-3">
              {request.request_items.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Item:</span> {item.items?.name} ({item.items?.unit})
                    </div>
                    <div>
                      <span className="font-medium">Quantity:</span> {item.quantity}
                    </div>
                    {item.specifications && (
                      <div className="col-span-2">
                        <span className="font-medium">Specifications:</span> {item.specifications}
                      </div>
                    )}
                    {item.notes && (
                      <div className="col-span-2">
                        <span className="font-medium">Notes:</span> {item.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          {request.notes && (
            <div>
              <h4 className="font-medium mb-2">Notes</h4>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded whitespace-pre-wrap">
                {request.notes}
              </p>
            </div>
          )}

          {/* Action Reason Input */}
          {showReasonField && (
            <div className="space-y-2">
              <Label htmlFor="action-reason">
                Reason for {actionType} {actionType === 'reject' ? '(required)' : ''}
              </Label>
              <Textarea
                id="action-reason"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={`Please provide a reason for ${actionType}ing this request...`}
                rows={3}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            
            {userRole === 'admin' && request.status === 'pending' && !showReasonField && (
              <>
                <Button 
                  variant="default" 
                  onClick={() => handleAction('approve')}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => handleAction('modify')}
                  disabled={actionLoading}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modify
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleAction('reject')}
                  disabled={actionLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}

            {showReasonField && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowReasonField(false);
                    setActionReason('');
                    setActionType(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={submitWithReason}
                  disabled={actionLoading || !actionReason.trim()}
                  variant={actionType === 'reject' ? 'destructive' : 'default'}
                >
                  {actionLoading ? 'Processing...' : `Confirm ${actionType}`}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestDetailsDialog;