import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Flame,
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Shield,
  Users,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  BarChart3,
  AlertTriangle,
  MessageSquare,
  Search,
  Menu
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
  roles?: string[];
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FileText, label: 'Applications', href: '/applications' },
  
  { icon: ClipboardCheck, label: 'Inspections', href: '/inspections', roles: ['fire_officer', 'senior_officer', 'admin'] },
  { icon: Shield, label: 'NOC Verification', href: '/verify' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics', roles: ['senior_officer', 'admin'] },
  { icon: AlertTriangle, label: 'Deficiencies', href: '/deficiencies', roles: ['fire_officer', 'senior_officer', 'admin'] },
  { icon: MessageSquare, label: 'Grievances', href: '/grievances' },
  { icon: Shield, label: 'Admin Dashboard', href: '/admin', roles: ['admin'] },
  { icon: Users, label: 'User Management', href: '/users', roles: ['admin'] },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  read: boolean | null;
  action_url: string | null;
  created_at: string;
  type: string;
};

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, roles, signOut, user } = useAuth();

  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const loadNotifications = async () => {
    if (!user) return;
    setIsNotificationsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, message, read, action_url, created_at, type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      setNotifications((data ?? []) as NotificationRow[]);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.some(role => roles.includes(role as any));
  });

  const getRoleBadge = () => {
    if (roles.includes('admin')) return { label: 'Admin', variant: 'destructive' as const };
    if (roles.includes('senior_officer')) return { label: 'Senior Officer', variant: 'default' as const };
    if (roles.includes('fire_officer')) return { label: 'Fire Officer', variant: 'secondary' as const };
    return { label: 'Applicant', variant: 'outline' as const };
  };

  const roleBadge = getRoleBadge();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 p-4 border-b border-sidebar-border",
        collapsed && "justify-center"
      )}>
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sidebar-primary">
          <Flame className="w-6 h-6 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-sidebar-foreground">Fire Safety</span>
            <span className="text-xs text-sidebar-foreground/70">Monitoring System</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "hover:bg-sidebar-accent",
                isActive && "bg-sidebar-accent text-sidebar-primary",
                !isActive && "text-sidebar-foreground/80",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-sidebar-primary")} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className={cn(
        "p-3 border-t border-sidebar-border",
        collapsed && "flex justify-center"
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center gap-3 w-full p-2 rounded-lg hover:bg-sidebar-accent transition-colors",
              collapsed && "justify-center"
            )}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {profile?.full_name || 'User'}
                  </p>
                  <Badge variant={roleBadge.variant} className="text-xs h-5 mt-0.5 bg-white text-black">
                    {roleBadge.label}
                  </Badge>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Collapse button (desktop only) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border items-center justify-center hover:bg-accent transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col relative bg-sidebar border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-[70px]" : "w-[260px]"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[260px] bg-sidebar border-sidebar-border">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search applications, buildings..."
                className="w-[300px] pl-9 bg-background"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu onOpenChange={(open) => open && loadNotifications()}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isNotificationsLoading ? (
                  <div className="p-4 text-sm text-muted-foreground">Loading…</div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No notifications.</div>
                ) : (
                  notifications.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      className="flex flex-col items-start gap-1 whitespace-normal"
                      onSelect={async () => {
                        try {
                          if (!n.read) {
                            const { error } = await supabase
                              .from('notifications')
                              .update({ read: true })
                              .eq('id', n.id);
                            if (error) throw error;
                            setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
                          }
                          if (n.action_url) navigate(n.action_url);
                        } catch (err: any) {
                          toast.error(err?.message || 'Failed to open notification');
                        }
                      }}
                    >
                      <div className="w-full">
                        <div className="flex items-center justify-between gap-3">
                          <span className={cn('text-sm', !n.read && 'font-semibold')}>{n.title}</span>
                          {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}