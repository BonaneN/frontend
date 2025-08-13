import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Trash2 } from 'lucide-react';

interface CreateRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface RequestItem {
  item_id: string;
  quantity: number;
  specifications: string;
  notes: string;
}

interface Item {
  id: string;
  name: string;
  unit: string;
}

interface Branch {
  id: string;
  branch_name: string;
}

const CreateRequestDialog = ({ open, onOpenChange, onSuccess }: CreateRequestDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    required_date: '',
    branch_id: '',
    notes: '',
  });

  const [requestItems, setRequestItems] = useState<RequestItem[]>([
    { item_id: '', quantity: 1, specifications: '', notes: '' }
  ]);

  useEffect(() => {
    if (open) {
      fetchItems();
      fetchBranches();
    }
  }, [open]);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('items')
      .select('id, name, unit')
      .order('name');

    if (!error && data) {
      setItems(data);
    }
  };

  const fetchBranches = async () => {
    const { data, error } = await supabase
      .from('branches')
      .select('id, branch_name')
      .order('branch_name');

    if (!error && data) {
      setBranches(data);
    }
  };

  const generateRequestNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `REQ-${year}${month}-${timestamp}`;
  };

  const addRequestItem = () => {
    setRequestItems([...requestItems, { item_id: '', quantity: 1, specifications: '', notes: '' }]);
  };

  const removeRequestItem = (index: number) => {
    setRequestItems(requestItems.filter((_, i) => i !== index));
  };

  const updateRequestItem = (index: number, field: keyof RequestItem, value: string | number) => {
    const updated = [...requestItems];
    updated[index] = { ...updated[index], [field]: value };
    setRequestItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.user_id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User not authenticated",
      });
      return;
    }

    if (requestItems.some(item => !item.item_id || item.quantity <= 0)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please complete all request items",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create the supply request
      const { data: requestData, error: requestError } = await supabase
        .from('supply_requests')
        .insert({
          request_number: generateRequestNumber(),
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          required_date: formData.required_date || null,
          branch_id: formData.branch_id,
          notes: formData.notes,
          requested_by: profile.user_id,
        })
        .select()
        .single();

      if (requestError) {
        throw requestError;
      }

      // Add request items
      const requestItemsData = requestItems.map(item => ({
        request_id: requestData.id,
        item_id: item.item_id,
        quantity: item.quantity,
        specifications: item.specifications || null,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from('request_items')
        .insert(requestItemsData);

      if (itemsError) {
        throw itemsError;
      }

      toast({
        title: "Success",
        description: "Supply request created successfully",
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        required_date: '',
        branch_id: '',
        notes: '',
      });
      setRequestItems([{ item_id: '', quantity: 1, specifications: '', notes: '' }]);
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create request",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Supply Request</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Request title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch_id">Branch</Label>
              <Select value={formData.branch_id} onValueChange={(value) => setFormData({ ...formData, branch_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.branch_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="required_date">Required Date</Label>
              <Input
                id="required_date"
                type="date"
                value={formData.required_date}
                onChange={(e) => setFormData({ ...formData, required_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the request"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Request Items</Label>
              <Button type="button" onClick={addRequestItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {requestItems.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {requestItems.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRequestItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Item</Label>
                    <Select 
                      value={item.item_id} 
                      onValueChange={(value) => updateRequestItem(index, 'item_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((availableItem) => (
                          <SelectItem key={availableItem.id} value={availableItem.id}>
                            {availableItem.name} ({availableItem.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateRequestItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Specifications</Label>
                    <Input
                      value={item.specifications}
                      onChange={(e) => updateRequestItem(index, 'specifications', e.target.value)}
                      placeholder="Specific requirements"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input
                      value={item.notes}
                      onChange={(e) => updateRequestItem(index, 'notes', e.target.value)}
                      placeholder="Additional notes"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRequestDialog;