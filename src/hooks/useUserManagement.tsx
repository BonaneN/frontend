import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'branch' | 'supplier';
  branch_name?: string;
  supplier_company?: string;
}

interface UpdateUserData {
  full_name?: string;
  role?: 'admin' | 'branch' | 'supplier';
  branch_name?: string;
  supplier_company?: string;
}

export const useUserManagement = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createUser = async (userData: CreateUserData) => {
    try {
      setLoading(true);
      
      // Create user via Supabase admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          full_name: userData.full_name,
          role: userData.role,
          branch_name: userData.branch_name,
          supplier_company: userData.supplier_company,
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
        return { success: false, error };
      }

      toast({
        title: "Success",
        description: "User created successfully",
      });
      
      return { success: true, user: data.user };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create user",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, userData: UpdateUserData) => {
    try {
      setLoading(true);
      
      // Update user metadata
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: userData
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
        return { success: false, error };
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: userData.full_name,
          role: userData.role,
          branch_name: userData.branch_name,
          supplier_company: userData.supplier_company,
        })
        .eq('user_id', userId);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });
      
      return { success: true };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
        return { success: false, error };
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      return { success: true };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (userId: string, newPassword: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
        return { success: false, error };
      }

      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      
      return { success: true };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update password",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    loading,
  };
};