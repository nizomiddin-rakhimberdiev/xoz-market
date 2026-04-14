import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  DollarSign,
  LogOut,
  Menu,
  Bell,
  Settings,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/orders', label: 'Buyurtmalar', icon: ShoppingCart },
  { href: '/dashboard/products', label: 'Mahsulotlar', icon: Package },
  { href: '/dashboard/categories', label: 'Kategoriyalar', icon: Tags },
  { href: '/dashboard/financial', label: 'Moliya', icon: DollarSign },
  { href: '/dashboard/settings', label: 'Sozlamalar', icon: Settings },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userStore, isLoading, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useRealtimeOrders();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    toast.success('Chiqish amalga oshirildi');
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {navItems.map((item) => {
        const isActive = item.exact
          ? location.pathname === item.href
          : location.pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onClick}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        );
      })}

      {userStore && (
        <Link
          to={`/store/${userStore.slug}`}
          target="_blank"
          onClick={onClick}
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <ExternalLink className="w-5 h-5" />
          Do'konni ko'rish
        </Link>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:border-r lg:border-border lg:bg-card">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
            {userStore?.logo_url ? (
              <img src={userStore.logo_url} alt={userStore.name} className="w-9 h-9 rounded-lg object-cover" />
            ) : (
              <Building2 className="w-8 h-8 text-primary" />
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-display text-lg font-bold leading-tight truncate">
                {userStore?.name || 'Do\'konim'}
              </span>
              <span className="text-xs text-muted-foreground">QurilishBozor</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <NavLinks />
          </nav>

          <div className="p-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all font-medium"
            >
              <LogOut className="w-5 h-5" />
              Chiqish
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
                  {userStore?.logo_url ? (
                    <img src={userStore.logo_url} alt={userStore.name} className="w-9 h-9 rounded-lg object-cover" />
                  ) : (
                    <Building2 className="w-8 h-8 text-primary" />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-display text-lg font-bold leading-tight truncate">
                      {userStore?.name || 'Do\'konim'}
                    </span>
                    <span className="text-xs text-muted-foreground">QurilishBozor</span>
                  </div>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                  <NavLinks onClick={() => setIsMobileMenuOpen(false)} />
                </nav>
                <div className="p-4 border-t border-border">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    Chiqish
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
