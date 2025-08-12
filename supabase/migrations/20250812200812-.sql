-- Insert sample categories
INSERT INTO public.categories (name, description) VALUES 
('Office Supplies', 'General office and administrative supplies'),
('IT Equipment', 'Computer hardware and software'),
('Cleaning Supplies', 'Janitorial and maintenance supplies'),
('Safety Equipment', 'Personal protective equipment and safety gear');

-- Insert sample items
INSERT INTO public.items (name, description, category_id, unit) VALUES 
('Printer Paper A4', 'Standard white printer paper', (SELECT id FROM categories WHERE name = 'Office Supplies'), 'box'),
('Laptop', 'Business laptop computer', (SELECT id FROM categories WHERE name = 'IT Equipment'), 'pcs'),
('Hand Sanitizer', 'Alcohol-based hand sanitizer', (SELECT id FROM categories WHERE name = 'Cleaning Supplies'), 'bottle'),
('Safety Helmet', 'Construction safety helmet', (SELECT id FROM categories WHERE name = 'Safety Equipment'), 'pcs');

-- Insert sample branch
INSERT INTO public.branches (branch_name, manager_name, address, phone, email) VALUES 
('Downtown Branch', 'John Smith', '123 Main St, Downtown', '+1-555-0123', 'downtown@company.com');

-- Insert sample supplier
INSERT INTO public.suppliers (company_name, contact_person, email, phone, address, category) VALUES 
('Office Depot Inc', 'Jane Doe', 'jane@officedepot.com', '+1-555-0456', '456 Supply Ave', 'Office Supplies');