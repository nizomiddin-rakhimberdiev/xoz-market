import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Search, ShoppingCart, Menu, Building2, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCartStore } from '@/stores/cartStore';
import { useStoreContext } from '@/contexts/StoreContext';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

export function StoreHeader() {
  const { slug } = useParams<{ slug: string }>();
  const { store } = useStoreContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const totalItems = useCartStore((state) => state.getTotalItems());

  const storeBase = `/store/${slug}`;
  const { customer, signOut } = useCustomerAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${storeBase}?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link
            to={storeBase}
            className="flex items-center gap-2 font-display text-xl font-bold text-primary shrink-0"
          >
            {store?.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <Building2 className="w-7 h-7" />
            )}
            <span className="hidden sm:inline">{store?.name || 'Do\'kon'}</span>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Mahsulotlarni qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full bg-secondary/50 border-0 focus-visible:ring-primary"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <Link to={`${storeBase}/cart`}>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="cart-badge">{totalItems > 99 ? '99+' : totalItems}</span>
                )}
              </Button>
            </Link>

            {customer ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2 text-sm font-medium border-b border-border mb-1">
                    {customer.first_name} {customer.last_name}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to={`${storeBase}/account`} className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Mening buyurtmalarim
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Chiqish
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to={`${storeBase}/login`}>
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
            )}

            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col gap-6 pt-6">
                  <form onSubmit={handleSearch}>
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Qidirish..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </form>
                  <nav className="flex flex-col gap-2">
                    <Link
                      to={storeBase}
                      className="px-4 py-3 rounded-lg hover:bg-secondary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Bosh sahifa
                    </Link>
                    <Link
                      to={`${storeBase}/cart`}
                      className="px-4 py-3 rounded-lg hover:bg-secondary transition-colors flex items-center justify-between"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>Savat</span>
                      {totalItems > 0 && (
                        <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-sm">
                          {totalItems}
                        </span>
                      )}
                    </Link>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Mahsulotlarni qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-0"
            />
          </div>
        </form>
      </div>
    </header>
  );
}
