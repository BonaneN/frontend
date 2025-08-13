-- Create budget management tables
CREATE TABLE public.annual_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  total_budget NUMERIC(15,2) NOT NULL DEFAULT 0,
  allocated_budget NUMERIC(15,2) NOT NULL DEFAULT 0,
  used_budget NUMERIC(15,2) NOT NULL DEFAULT 0,
  remaining_budget NUMERIC(15,2) GENERATED ALWAYS AS (total_budget - used_budget) STORED,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.annual_budgets ENABLE ROW LEVEL SECURITY;

-- Create policies for budget management
CREATE POLICY "Admins can manage budgets"
ON public.annual_budgets
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view budgets"
ON public.annual_budgets
FOR SELECT
USING (true);

-- Create budget categories table
CREATE TABLE public.budget_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES public.annual_budgets(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  allocated_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  used_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(15,2) GENERATED ALWAYS AS (allocated_amount - used_amount) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for budget categories
CREATE POLICY "Admins can manage budget categories"
ON public.budget_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view budget categories"
ON public.budget_categories
FOR SELECT
USING (true);

-- Create budget expenses table
CREATE TABLE public.budget_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES public.annual_budgets(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.budget_categories(id) ON DELETE SET NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(15,2) NOT NULL,
  description TEXT NOT NULL,
  expense_type TEXT NOT NULL DEFAULT 'operational' CHECK (expense_type IN ('operational', 'procurement', 'maintenance', 'other')),
  reference_number TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budget_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for budget expenses
CREATE POLICY "Admins can manage budget expenses"
ON public.budget_expenses
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view budget expenses"
ON public.budget_expenses
FOR SELECT
USING (true);

-- Create function to update budget usage when expenses are added
CREATE OR REPLACE FUNCTION public.update_budget_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the main budget used amount
  UPDATE public.annual_budgets 
  SET used_budget = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM public.budget_expenses 
    WHERE budget_id = NEW.budget_id
  ),
  updated_at = now()
  WHERE id = NEW.budget_id;
  
  -- Update category used amount if category is specified
  IF NEW.category_id IS NOT NULL THEN
    UPDATE public.budget_categories 
    SET used_amount = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM public.budget_expenses 
      WHERE category_id = NEW.category_id
    ),
    updated_at = now()
    WHERE id = NEW.category_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for budget usage updates
CREATE TRIGGER update_budget_usage_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.budget_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_budget_usage();

-- Add triggers for timestamp updates
CREATE TRIGGER update_annual_budgets_updated_at
  BEFORE UPDATE ON public.annual_budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_categories_updated_at
  BEFORE UPDATE ON public.budget_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_expenses_updated_at
  BEFORE UPDATE ON public.budget_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample budget data for 2024 and 2025
INSERT INTO public.annual_budgets (year, total_budget, created_by) VALUES 
(2024, 500000.00, '00000000-0000-0000-0000-000000000000'),
(2025, 750000.00, '00000000-0000-0000-0000-000000000000');

-- Insert sample budget categories
INSERT INTO public.budget_categories (budget_id, category_name, allocated_amount) 
SELECT 
  b.id,
  category,
  amount
FROM public.annual_budgets b
CROSS JOIN (VALUES 
  ('Office Supplies', 50000.00),
  ('Equipment', 150000.00),
  ('Maintenance', 75000.00),
  ('Operations', 100000.00),
  ('Emergency Fund', 25000.00)
) AS categories(category, amount)
WHERE b.year = 2024;

INSERT INTO public.budget_categories (budget_id, category_name, allocated_amount) 
SELECT 
  b.id,
  category,
  amount
FROM public.annual_budgets b
CROSS JOIN (VALUES 
  ('Office Supplies', 75000.00),
  ('Equipment', 225000.00),
  ('Maintenance', 100000.00),
  ('Operations', 150000.00),
  ('Emergency Fund', 50000.00),
  ('Technology Upgrade', 100000.00)
) AS categories(category, amount)
WHERE b.year = 2025;

-- Insert sample expenses for 2024
INSERT INTO public.budget_expenses (budget_id, category_id, expense_date, amount, description, expense_type, created_by)
SELECT 
  b.id,
  bc.id,
  '2024-01-15'::date + (random() * 300)::int,
  (random() * 5000 + 500)::numeric(15,2),
  'Sample expense for ' || bc.category_name,
  (ARRAY['operational', 'procurement', 'maintenance'])[floor(random() * 3 + 1)],
  '00000000-0000-0000-0000-000000000000'
FROM public.annual_budgets b
JOIN public.budget_categories bc ON bc.budget_id = b.id
WHERE b.year = 2024
AND random() < 0.7; -- 70% chance of having an expense