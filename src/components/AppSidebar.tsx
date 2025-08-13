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
  Calendar, Home, Inbox, Search, Settings, Package, Users, FileText, Truck, BarChart3, DollarSign
} from "lucide-react";
import { useLocation, useNavigate } from 'react-router-dom';

// Menu items.
const items = [
  { title: "Dashboard", url: "/", icon: Home, roles: ['admin', 'branch', 'supplier'] },
  { title: "Inventory", url: "/inventory", icon: Package, roles: ['admin', 'branch'] },
  { title: "Requests", url: "/requests", icon: FileText, roles: ['admin', 'branch'] },
  { title: "Budget Management", url: "/budget", icon: DollarSign, roles: ['admin'] },
  { title: "User Management", url: "/user-management", icon: Users, roles: ['admin'] },
];

const AppSidebar = () => {
  const { userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const filteredItems = items.filter(item => 
    item.roles.includes(userRole as string)
  );

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Supply Chain Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.url}
                    onClick={() => navigate(item.url)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
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