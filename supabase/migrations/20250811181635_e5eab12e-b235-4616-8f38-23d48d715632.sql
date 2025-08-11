-- Create user roles enum
CREATE TYPE app_role AS ENUM ('admin', 'branch', 'supplier', 'auditor');

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create items/products table  
CREATE TABLE public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  unit TEXT NOT NULL DEFAULT 'pcs',
  specifications JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create branches table
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_name TEXT NOT NULL,
  manager_name TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  user_id UUID,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  category TEXT,
  user_id UUID,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supply requests table
CREATE TABLE public.supply_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT NOT NULL,
  branch_id UUID NOT NULL REFERENCES public.branches(id),
  requested_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  requested_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  required_date TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  approved_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create request items table
CREATE TABLE public.request_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.supply_requests(id),
  item_id UUID NOT NULL REFERENCES public.items(id),
  quantity INTEGER NOT NULL,
  specifications TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL,
  request_id UUID NOT NULL REFERENCES public.supply_requests(id),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  status TEXT DEFAULT 'pending',
  expected_delivery TIMESTAMP WITH TIME ZONE,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shipments table
CREATE TABLE public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_number TEXT NOT NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  carrier TEXT,
  tracking_number TEXT,
  shipped_date TIMESTAMP WITH TIME ZONE,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'preparing',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT 'User',
  email TEXT,
  role app_role NOT NULL DEFAULT 'branch',
  branch_name TEXT,
  supplier_company TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'branch'::public.app_role)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = now();
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'branch'::public.app_role)
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create policies for categories
CREATE POLICY "Everyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create policies for items
CREATE POLICY "Everyone can view items" ON public.items FOR SELECT USING (true);
CREATE POLICY "Admins can manage items" ON public.items FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create policies for branches
CREATE POLICY "Branches can view their own data" ON public.branches FOR SELECT USING (
  auth.uid() = user_id OR has_role(auth.uid(), 'admin')
);
CREATE POLICY "Branches can update their own data" ON public.branches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage branches" ON public.branches FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create policies for suppliers
CREATE POLICY "Suppliers can view their own data" ON public.suppliers FOR SELECT USING (
  auth.uid() = user_id OR has_role(auth.uid(), 'admin')
);
CREATE POLICY "Suppliers can update their own data" ON public.suppliers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage suppliers" ON public.suppliers FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create policies for supply requests
CREATE POLICY "Branches can view their own requests" ON public.supply_requests FOR SELECT USING (
  requested_by = auth.uid() OR has_role(auth.uid(), 'admin')
);
CREATE POLICY "Branches can create requests" ON public.supply_requests FOR INSERT WITH CHECK (
  requested_by = auth.uid() AND has_role(auth.uid(), 'branch')
);
CREATE POLICY "Branches can update their own requests" ON public.supply_requests FOR UPDATE USING (
  requested_by = auth.uid() OR has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admins can manage all requests" ON public.supply_requests FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create policies for request items
CREATE POLICY "Users can view request items for their requests" ON public.request_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.supply_requests 
    WHERE supply_requests.id = request_items.request_id 
    AND (supply_requests.requested_by = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);
CREATE POLICY "Users can manage request items for their requests" ON public.request_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.supply_requests 
    WHERE supply_requests.id = request_items.request_id 
    AND (supply_requests.requested_by = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

-- Create policies for orders
CREATE POLICY "Suppliers can view their orders" ON public.orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.suppliers 
    WHERE suppliers.id = orders.supplier_id 
    AND suppliers.user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admins and suppliers can manage orders" ON public.orders FOR ALL USING (
  has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.suppliers 
    WHERE suppliers.id = orders.supplier_id 
    AND suppliers.user_id = auth.uid()
  )
);

-- Create policies for shipments
CREATE POLICY "Related users can view shipments" ON public.shipments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    JOIN public.suppliers s ON o.supplier_id = s.id 
    WHERE o.id = shipments.order_id 
    AND (s.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);
CREATE POLICY "Suppliers and admins can manage shipments" ON public.shipments FOR ALL USING (
  has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.orders o 
    JOIN public.suppliers s ON o.supplier_id = s.id 
    WHERE o.id = shipments.order_id 
    AND s.user_id = auth.uid()
  )
);

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_supply_requests_updated_at BEFORE UPDATE ON public.supply_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();