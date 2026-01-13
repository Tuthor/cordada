import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
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

const settingsNavItems = [
  { title: "Configuración", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const channel = subscribeToMessages();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    
    const { count } = await supabase
      .from('project_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false);
    
    setUnreadCount(count || 0);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('sidebar-unread')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_messages',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return channel;
  };

  const mainNavItems = [
    { title: "Inicio", url: "/dashboard", icon: Home, badge: 0 },
    { title: "Directorio", url: "/directory", icon: Users, badge: 0 },
    { title: "Proyectos", url: "/projects", icon: Briefcase, badge: 0 },
    { title: "Inbox", url: "/inbox", icon: Inbox, badge: unreadCount },
    { title: "Propuestas", url: "/proposals", icon: FileText, badge: 0 },
    { title: "Capacitación", url: "/training", icon: GraduationCap, badge: 0 },
  ];

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
                      className="flex items-center gap-3 relative"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <div className="relative">
                        <item.icon className="h-5 w-5" />
                        {item.badge > 0 && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        )}
                      </div>
                      {!collapsed && (
                        <span className="flex-1">{item.title}</span>
                      )}
                      {!collapsed && item.badge > 0 && (
                        <Badge variant="destructive" className="text-xs h-5 min-w-5 flex items-center justify-center">
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      )}
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
