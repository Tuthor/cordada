import { useLocation } from "react-router-dom";
import { 
  Home, 
  Users, 
  Briefcase, 
  Inbox, 
  FileText, 
  GraduationCap, 
  Settings,
  LogOut,
  Building2,
  User,
  Building
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const roleLabels: Record<string, { label: string; icon: typeof User; variant: 'default' | 'secondary' | 'outline' }> = {
  client: { label: 'Cliente', icon: Building2, variant: 'default' },
  consultant: { label: 'Consultor', icon: User, variant: 'secondary' },
  consulting_firm: { label: 'Empresa Consultora', icon: Building, variant: 'outline' },
};

const mainNavItems = [
  { title: "Inicio", url: "/dashboard", icon: Home },
  { title: "Directorio", url: "/directory", icon: Users },
  { title: "Proyectos", url: "/projects", icon: Briefcase },
  { title: "Inbox", url: "/inbox", icon: Inbox },
  { title: "Propuestas", url: "/proposals", icon: FileText },
  { title: "Capacitación", url: "/training", icon: GraduationCap },
];

const settingsNavItems = [
  { title: "Configuración", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
  };

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U';

  const currentRole = userRole && roleLabels[userRole] ? roleLabels[userRole] : null;
  const RoleIcon = currentRole?.icon;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        {/* Logo */}
        <div className={`p-4 border-b border-border ${collapsed ? 'px-2' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-accent-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-foreground">ConsultHub</h1>
                <p className="text-xs text-muted-foreground">Marketplace B2B</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupLabel>Cuenta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with user info */}
      <SidebarFooter className="border-t border-border p-4">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.user_metadata?.full_name || 'Usuario'}
              </p>
              {currentRole && (
                <Badge variant={currentRole.variant} className="mt-1 text-xs gap-1">
                  {RoleIcon && <RoleIcon className="h-3 w-3" />}
                  {currentRole.label}
                </Badge>
              )}
            </div>
          )}
          {!collapsed && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
