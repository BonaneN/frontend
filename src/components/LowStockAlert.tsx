import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LowStockItem {
  id: string;
  name: string;
  current_stock: number;
  min_stock_level: number;
  unit: string;
  category?: string;
  unit_cost: number;
}

interface LowStockAlertProps {
  userRole: string;
}

const LowStockAlert: React.FC<LowStockAlertProps> = ({ userRole }) => {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchLowStockItems();
    }
  }, [userRole]);

  const fetchLowStockItems = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          items (
            id,
            name,
            unit,
            categories (
              name
            )
          )
        `)
        .order('current_stock', { ascending: true });

      if (error) {
        console.error('Error fetching low stock items:', error);
        return;
      }

      // Filter items where current stock is below minimum stock level
      const filteredData = data?.filter(item => 
        item.current_stock < item.min_stock_level
      ) || [];

      const formattedItems: LowStockItem[] = filteredData.map(item => ({
        id: item.id,
        name: item.items?.name || 'Unknown Item',
        current_stock: item.current_stock,
        min_stock_level: item.min_stock_level,
        unit: item.items?.unit || 'pcs',
        category: item.items?.categories?.name,
        unit_cost: Number(item.unit_cost)
      }));

      setLowStockItems(formattedItems);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStockLevel = (current: number, min: number) => {
    const percentage = (current / min) * 100;
    if (percentage <= 25) return { level: 'critical', color: 'destructive' };
    if (percentage <= 50) return { level: 'low', color: 'destructive' };
    if (percentage <= 75) return { level: 'warning', color: 'secondary' };
    return { level: 'normal', color: 'default' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Low Stock Alerts
          {lowStockItems.length > 0 && (
            <Badge variant="destructive">{lowStockItems.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lowStockItems.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Stock Levels Good</h3>
            <p className="text-muted-foreground">
              No items are currently below their minimum stock levels.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {lowStockItems.map((item) => {
              const stockInfo = getStockLevel(item.current_stock, item.min_stock_level);
              const restockValue = (item.min_stock_level - item.current_stock) * item.unit_cost;
              
              return (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.category && (
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                      )}
                    </div>
                    <Badge variant={stockInfo.color as any}>
                      {stockInfo.level}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Current Stock</p>
                      <p className="font-medium flex items-center gap-1">
                        <TrendingDown className="h-4 w-4 text-destructive" />
                        {item.current_stock} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Minimum Required</p>
                      <p className="font-medium">{item.min_stock_level} {item.unit}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Shortage</p>
                      <p className="font-medium text-destructive">
                        {item.min_stock_level - item.current_stock} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Restock Value</p>
                      <p className="font-medium">{formatCurrency(restockValue)}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Create Request
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Find Supplier
                    </Button>
                  </div>
                </div>
              );
            })}
            
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Items Low</p>
                  <p className="font-medium">{lowStockItems.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Est. Restock Cost</p>
                  <p className="font-medium">
                    {formatCurrency(
                      lowStockItems.reduce((sum, item) => 
                        sum + ((item.min_stock_level - item.current_stock) * item.unit_cost), 0
                      )
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LowStockAlert;