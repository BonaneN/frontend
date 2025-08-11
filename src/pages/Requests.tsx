import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ClipboardList, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SupplyRequest {
  id: string;
  request_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  requested_date: string;
  required_date: string;
  branches: {
    branch_name: string;
  } | null;
  profiles: {
    full_name: string;
  } | null;
}

const Requests = () => {
  const { userRole, profile } = useAuth();
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('supply_requests')
          .select(`
            *,
            branches(branch_name),
            profiles(full_name)
          `)
          .order('created_at', { ascending: false });

        // Filter requests based on user role
        if (userRole === 'branch') {
          query = query.eq('requested_by', profile?.user_id);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching requests:', error);
          return;
        }

        setRequests((data || []) as any);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profile) {
      fetchRequests();
    }
  }, [userRole, profile]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'pending':
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
            {userRole === 'admin' 
              ? 'Manage all supply requests from branches' 
              : 'Manage your supply requests'}
          </p>
        </div>
        {userRole === 'branch' && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Requests ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No requests found</h3>
              <p className="text-muted-foreground">
                {userRole === 'branch' 
                  ? 'You haven\'t created any supply requests yet.' 
                  : 'No supply requests have been submitted.'}
              </p>
              {userRole === 'branch' && (
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Request
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request #</TableHead>
                  <TableHead>Title</TableHead>
                  {userRole === 'admin' && <TableHead>Branch</TableHead>}
                  {userRole === 'admin' && <TableHead>Requested By</TableHead>}
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Required Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-sm">
                      {request.request_number}
                    </TableCell>
                    <TableCell className="font-medium">{request.title}</TableCell>
                    {userRole === 'admin' && (
                      <TableCell>
                        <Badge variant="outline">
                          {request.branches?.branch_name || 'Unknown Branch'}
                        </Badge>
                      </TableCell>
                    )}
                    {userRole === 'admin' && (
                      <TableCell>{request.profiles?.full_name || 'Unknown User'}</TableCell>
                    )}
                    <TableCell>
                      <Badge variant={getPriorityVariant(request.priority)}>
                        {request.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <Badge variant={getStatusVariant(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.required_date 
                        ? new Date(request.required_date).toLocaleDateString()
                        : 'Not specified'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        {userRole === 'admin' && request.status === 'pending' && (
                          <>
                            <Button variant="default" size="sm">
                              Approve
                            </Button>
                            <Button variant="destructive" size="sm">
                              Reject
                            </Button>
                          </>
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

export default Requests;