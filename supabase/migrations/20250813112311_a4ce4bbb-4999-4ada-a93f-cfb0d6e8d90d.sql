-- Fix search path security issue for budget function
CREATE OR REPLACE FUNCTION public.update_budget_usage()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;