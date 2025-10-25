import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  Users,
  LogOut,
  ChevronLeft,
  Factory,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'almacenero', 'produccion'] },
  { title: 'Materiales', url: '/materiales', icon: Package, roles: ['admin', 'almacenero', 'produccion'] },
  { title: 'Usuarios', url: '/usuarios', icon: Users, roles: ['admin'] },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const filteredItems = menuItems.filter(item => 
    user && item.roles.some(role => user.roles.includes(role as any))
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Factory className="h-6 w-6 text-sidebar-primary" />
            <span className="font-bold text-sidebar-foreground">JOSAFAT</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {!isCollapsed && user && (
          <div className="mb-3">
            <p className="text-sm font-medium text-sidebar-foreground">{user.nombre}</p>
            <p className="text-xs text-sidebar-foreground/70">{user.email}</p>
            <p className="text-xs text-sidebar-primary font-medium mt-1 capitalize">
              {user.roles.join(', ')}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Cerrar Sesión</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
