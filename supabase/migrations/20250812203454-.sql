-- Insert sample data for testing

-- Insert sample categories
INSERT INTO public.categories (name, description) VALUES
('Electronics', 'Electronic devices and components'),
('Office Supplies', 'General office supplies and stationery'),
('Furniture', 'Office and warehouse furniture'),
('Cleaning', 'Cleaning supplies and equipment'),
('Safety', 'Safety equipment and protective gear')
ON CONFLICT DO NOTHING;

-- Insert sample items with low stock scenarios
INSERT INTO public.items (name, description, unit, category_id, specifications) 
SELECT 
  'Laptop Computer', 
  'Business laptop for office use', 
  'pcs', 
  c.id,
  '{"brand": "Dell", "model": "Latitude", "warranty": "3 years"}'::jsonb
FROM categories c WHERE c.name = 'Electronics'
ON CONFLICT DO NOTHING;

INSERT INTO public.items (name, description, unit, category_id, specifications) 
SELECT 
  'Office Chair', 
  'Ergonomic office chair', 
  'pcs', 
  c.id,
  '{"material": "fabric", "adjustable": true, "color": "black"}'::jsonb
FROM categories c WHERE c.name = 'Furniture'
ON CONFLICT DO NOTHING;

INSERT INTO public.items (name, description, unit, category_id, specifications) 
SELECT 
  'A4 Paper', 
  'Standard office paper', 
  'reams', 
  c.id,
  '{"size": "A4", "weight": "80gsm", "brightness": "95%"}'::jsonb
FROM categories c WHERE c.name = 'Office Supplies'
ON CONFLICT DO NOTHING;

INSERT INTO public.items (name, description, unit, category_id, specifications) 
SELECT 
  'Hand Sanitizer', 
  'Alcohol-based hand sanitizer', 
  'bottles', 
  c.id,
  '{"volume": "500ml", "alcohol_content": "70%", "antibacterial": true}'::jsonb
FROM categories c WHERE c.name = 'Cleaning'
ON CONFLICT DO NOTHING;

INSERT INTO public.items (name, description, unit, category_id, specifications) 
SELECT 
  'Safety Helmet', 
  'Construction safety helmet', 
  'pcs', 
  c.id,
  '{"material": "ABS", "color": "yellow", "adjustable": true}'::jsonb
FROM categories c WHERE c.name = 'Safety'
ON CONFLICT DO NOTHING;

-- Create inventory table for stock tracking
CREATE TABLE IF NOT EXISTS public.inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid REFERENCES public.items(id) NOT NULL,
  branch_id uuid REFERENCES public.branches(id),
  current_stock integer NOT NULL DEFAULT 0,
  min_stock_level integer NOT NULL DEFAULT 10,
  max_stock_level integer NOT NULL DEFAULT 100,
  unit_cost decimal(10,2) DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for inventory
CREATE POLICY "Admins can manage inventory" ON public.inventory
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Branches can view their inventory" ON public.inventory
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.branches b 
    WHERE b.id = inventory.branch_id 
    AND b.user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Insert sample inventory data with low stock scenarios
INSERT INTO public.inventory (item_id, current_stock, min_stock_level, max_stock_level, unit_cost)
SELECT i.id, 5, 20, 100, 1200.00
FROM public.items i WHERE i.name = 'Laptop Computer'
ON CONFLICT DO NOTHING;

INSERT INTO public.inventory (item_id, current_stock, min_stock_level, max_stock_level, unit_cost)
SELECT i.id, 3, 15, 50, 350.00
FROM public.items i WHERE i.name = 'Office Chair'
ON CONFLICT DO NOTHING;

INSERT INTO public.inventory (item_id, current_stock, min_stock_level, max_stock_level, unit_cost)
SELECT i.id, 50, 100, 500, 8.50
FROM public.items i WHERE i.name = 'A4 Paper'
ON CONFLICT DO NOTHING;

INSERT INTO public.inventory (item_id, current_stock, min_stock_level, max_stock_level, unit_cost)
SELECT i.id, 25, 30, 200, 12.00
FROM public.items i WHERE i.name = 'Hand Sanitizer'
ON CONFLICT DO NOTHING;

INSERT INTO public.inventory (item_id, current_stock, min_stock_level, max_stock_level, unit_cost)
SELECT i.id, 8, 25, 100, 45.00
FROM public.items i WHERE i.name = 'Safety Helmet'
ON CONFLICT DO NOTHING;

-- Create order_items table for revenue tracking
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) NOT NULL,
  item_id uuid REFERENCES public.items(id) NOT NULL,
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for order_items
CREATE POLICY "Admins and suppliers can manage order items" ON public.order_items
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM public.orders o 
    JOIN public.suppliers s ON o.supplier_id = s.id
    WHERE o.id = order_items.order_id AND s.user_id = auth.uid()
  )
);

-- Insert sample orders and order items for revenue analysis
DO $$
DECLARE
  sample_order_id uuid;
  laptop_item_id uuid;
  chair_item_id uuid;
  supplier_id uuid;
  request_id uuid;
BEGIN
  -- Get supplier and item IDs
  SELECT id INTO supplier_id FROM public.suppliers LIMIT 1;
  SELECT id INTO request_id FROM public.supply_requests LIMIT 1;
  SELECT id INTO laptop_item_id FROM public.items WHERE name = 'Laptop Computer';
  SELECT id INTO chair_item_id FROM public.items WHERE name = 'Office Chair';
  
  -- Create sample order if supplier and request exist
  IF supplier_id IS NOT NULL AND request_id IS NOT NULL THEN
    INSERT INTO public.orders (order_number, request_id, supplier_id, status, expected_delivery, notes)
    VALUES ('ORD-2024-001', request_id, supplier_id, 'completed', now() + interval '7 days', 'Sample order for testing')
    RETURNING id INTO sample_order_id;
    
    -- Insert order items
    IF laptop_item_id IS NOT NULL THEN
      INSERT INTO public.order_items (order_id, item_id, quantity, unit_price)
      VALUES (sample_order_id, laptop_item_id, 10, 1200.00);
    END IF;
    
    IF chair_item_id IS NOT NULL THEN
      INSERT INTO public.order_items (order_id, item_id, quantity, unit_price)
      VALUES (sample_order_id, chair_item_id, 5, 350.00);
    END IF;
  END IF;
END $$;