import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Building2,
  Users,
  FileText,
  BarChart3,
  Settings,
  ClipboardList,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const AppSidebar = () => {
  const { userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'User Management', path: '/users' },
    { icon: Building2, label: 'Branches', path: '/branches' },
    { icon: Users, label: 'Suppliers', path: '/suppliers' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: ClipboardList, label: 'Supply Requests', path: '/requests' },
    { icon: ShoppingCart, label: 'Purchase Orders', path: '/orders' },
    { icon: Truck, label: 'Shipments', path: '/shipments' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: FileText, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const branchMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'My Inventory', path: '/inventory' },
    { icon: ClipboardList, label: 'My Requests', path: '/requests' },
    { icon: Truck, label: 'Deliveries', path: '/shipments' },
    { icon: FileText, label: 'Reports', path: '/reports' },
  ];

  const supplierMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ShoppingCart, label: 'Purchase Orders', path: '/orders' },
    { icon: Truck, label: 'Shipments', path: '/shipments' },
    { icon: BarChart3, label: 'Performance', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const getMenuItems = () => {
    switch (userRole) {
      case 'admin':
        return adminMenuItems;
      case 'branch':
        return branchMenuItems;
      case 'supplier':
        return supplierMenuItems;
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.path}
                    onClick={() => navigate(item.path)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export { AppSidebar };