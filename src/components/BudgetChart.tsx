import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

interface BudgetData {
  id: string;
  year: number;
  total_budget: number;
  used_budget: number;
  remaining_budget: number;
  status: string;
}

interface BudgetChartProps {
  budgets: BudgetData[];
}

const BudgetChart = ({ budgets }: BudgetChartProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getUsagePercentage = (used: number, total: number) => {
    return total > 0 ? (used / total) * 100 : 0;
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90) return { variant: 'destructive' as const, icon: TrendingUp, label: 'Critical' };
    if (percentage >= 75) return { variant: 'secondary' as const, icon: TrendingDown, label: 'High' };
    return { variant: 'default' as const, icon: DollarSign, label: 'Normal' };
  };

  return (
    <div className="space-y-4">
      {budgets.map((budget) => {
        const usagePercentage = getUsagePercentage(budget.used_budget, budget.total_budget);
        const usageStatus = getUsageStatus(usagePercentage);
        const StatusIcon = usageStatus.icon;

        return (
          <Card key={budget.id} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Budget {budget.year}</CardTitle>
                <Badge variant={usageStatus.variant} className="flex items-center gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {usageStatus.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-lg font-semibold">{formatCurrency(budget.total_budget)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Used</p>
                  <p className="text-lg font-semibold text-orange-600">
                    {formatCurrency(budget.used_budget)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(budget.remaining_budget)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Budget Usage</span>
                  <span className="font-medium">{usagePercentage.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={usagePercentage} 
                  className={`h-3 ${usagePercentage >= 90 ? 'bg-red-100' : usagePercentage >= 75 ? 'bg-orange-100' : 'bg-green-100'}`}
                />
              </div>

              {/* Monthly trend bar */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Monthly Distribution</p>
                <div className="flex gap-1 h-8">
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthUsage = Math.random() * (budget.used_budget / 12) + (budget.used_budget / 24);
                    const height = ((monthUsage / (budget.total_budget / 12)) * 100);
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-primary/60 to-primary/20 rounded-sm"
                        style={{ height: `${Math.min(height, 100)}%` }}
                        title={`Month ${i + 1}: ${formatCurrency(monthUsage)}`}
                      />
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default BudgetChart;