import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUserManagement } from '@/hooks/useUserManagement';

const updateUserSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['admin', 'branch', 'supplier']),
  branch_name: z.string().optional(),
  supplier_company: z.string().optional(),
});

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    branch_name?: string;
    supplier_company?: string;
  } | null;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  user,
}) => {
  const { updateUser, resetPassword, loading } = useUserManagement();
  
  const updateForm = useForm<z.infer<typeof updateUserSchema>>({
    resolver: zodResolver(updateUserSchema),
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  });

  const watchRole = updateForm.watch('role');

  useEffect(() => {
    if (user) {
      updateForm.reset({
        full_name: user.full_name,
        role: user.role as any,
        branch_name: user.branch_name || '',
        supplier_company: user.supplier_company || '',
      });
    }
  }, [user, updateForm]);

  const handleUpdateUser = async (values: z.infer<typeof updateUserSchema>) => {
    if (!user) return;
    
    const result = await updateUser(user.id, values);
    if (result.success) {
      onOpenChange(false);
      onSuccess();
    }
  };

  const handleResetPassword = async (values: z.infer<typeof passwordSchema>) => {
    if (!user) return;
    
    const result = await resetPassword(user.id, values.password);
    if (result.success) {
      passwordForm.reset();
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and manage their account.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <form onSubmit={updateForm.handleSubmit(handleUpdateUser)} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email} disabled />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  placeholder="Enter full name"
                  {...updateForm.register('full_name')}
                />
                {updateForm.formState.errors.full_name && (
                  <p className="text-sm text-destructive">{updateForm.formState.errors.full_name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select onValueChange={(value) => updateForm.setValue('role', value as any)} value={watchRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Central Admin</SelectItem>
                    <SelectItem value="branch">Branch User</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                  </SelectContent>
                </Select>
                {updateForm.formState.errors.role && (
                  <p className="text-sm text-destructive">{updateForm.formState.errors.role.message}</p>
                )}
              </div>
              
              {watchRole === 'branch' && (
                <div className="space-y-2">
                  <Label htmlFor="branch_name">Branch Name</Label>
                  <Input
                    id="branch_name"
                    placeholder="Enter branch name"
                    {...updateForm.register('branch_name')}
                  />
                </div>
              )}
              
              {watchRole === 'supplier' && (
                <div className="space-y-2">
                  <Label htmlFor="supplier_company">Company Name</Label>
                  <Input
                    id="supplier_company"
                    placeholder="Enter company name"
                    {...updateForm.register('supplier_company')}
                  />
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update User'}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="password">
            <form onSubmit={passwordForm.handleSubmit(handleResetPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  {...passwordForm.register('password')}
                />
                {passwordForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.password.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  {...passwordForm.register('confirmPassword')}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => passwordForm.reset()}>
                  Reset Form
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;