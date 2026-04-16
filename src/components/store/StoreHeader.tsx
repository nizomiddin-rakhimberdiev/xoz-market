import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Search, ShoppingCart, Building2, User, LogOut, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCartStore } from '@/stores/cartStore';
import { useStoreContext } from '@/contexts/StoreContext';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

export function StoreHeader() {
  const { slug } = useParams<{ slug: string }>();
  const { store } = useStoreContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const storeBase = `/store/${slug}`;
  const { customer, signOut } = useCustomerAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`${storeBase}?search=${encodeURIComponent(q)}`);
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center h-14 sm:h-16 gap-2 sm:gap-3">

          {/* Logo + name */}
          <Link to={storeBase} className="flex items-center gap-2 shrink-0 min-w-0">
            {store?.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
            ) : (
              <Building2 className="w-7 h-7 text-primary shrink-0" />
            )}
            <span className="font-display font-bold text-base sm:text-lg truncate max-w-[120px] sm:max-w-[200px]">
              {store?.name || 'Do\'kon'}
            </span>
          </Link>

          {/* Search — desktop */}
          <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md ml-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Mahsulotlarni qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-xl bg-secondary/70 border-0 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              />
            </div>
          </form>

          <div className="flex items-center gap-1 ml-auto">
            {/* Search icon — mobile */}
            <button
              className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
              onClick={() => setSearchOpen(v => !v)}
            >
              {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>

            {/* Cart */}
            <Link to={`${storeBase}/cart`} className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            {/* User */}
            {customer ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {customer.first_name.charAt(0)}
                      </span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2 text-sm font-medium border-b border-border mb-1 truncate">
                    {customer.first_name} {customer.last_name}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to={`${storeBase}/account`} className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Buyurtmalarim
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Chiqish
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to={`${storeBase}/login`}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
              >
                <User className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Search — mobile expand */}
        {searchOpen && (
          <form onSubmit={handleSearch} className="sm:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                autoFocus
                type="search"
                placeholder="Mahsulotlarni qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-xl bg-secondary/70 border-0 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              />
            </div>
          </form>
        )}
      </div>
    </header>
  );
}
