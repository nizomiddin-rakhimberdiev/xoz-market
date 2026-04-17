import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Package, Heart, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/lib/api';
import type { Product, ProductVariant } from '@/types/database';
import { cn } from '@/lib/utils';
import { VariantDrawer } from './VariantDrawer';
import { AuthModal } from '@/components/store/AuthModal';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useWishlistStore } from '@/stores/wishlistStore';

interface ProductCardProps {
  product: Product;
  storeSlug?: string;
}

export function ProductCard({ product, storeSlug }: ProductCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const mainImage = product.images?.find((img) => img.is_main) || product.images?.[0];
  const { addItem, incrementQuantity, decrementQuantity, getItemQuantity, removeItem } = useCartStore();
  const { customer } = useCustomerAuth();
  const { toggle: toggleWishlist, has: inWishlist } = useWishlistStore();
  const isWishlisted = inWishlist(product.id);

  const activeVariants = product.variants?.filter((v) => v.is_active && v.stock_qty > 0) || [];
  const hasVariants = activeVariants.length > 0;
  const quantity = hasVariants ? 0 : getItemQuantity(product.id);
  const isInCart = quantity > 0;
  const isOutOfStock = hasVariants ? activeVariants.length === 0 : product.stock_qty <= 0;
  const discountPercent = product.old_price && product.old_price > product.price
    ? Math.round((1 - product.price / product.old_price) * 100)
    : null;

  const requireAuth = (action: () => void) => {
    if (!storeSlug || customer) action();
    else { setPendingAction(() => action); setAuthModalOpen(true); }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    requireAuth(() => {
      if (hasVariants) setDrawerOpen(true);
      else addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: mainImage?.image_url,
        stepQty: product.step_qty,
        minOrderQty: product.min_order_qty,
        stockQty: product.stock_qty,
      });
    });
  };

  const handleVariantAdd = (variant: ProductVariant) => {
    addItem({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      variantName: variant.name,
      price: variant.price_override ?? product.price,
      image: mainImage?.image_url,
      stepQty: product.step_qty,
      minOrderQty: product.min_order_qty,
      stockQty: variant.stock_qty,
    });
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    requireAuth(() => incrementQuantity(product.id));
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (quantity <= product.min_order_qty) removeItem(product.id);
    else decrementQuantity(product.id);
  };

  return (
    <>
      <Link
        to={storeSlug ? `/store/${storeSlug}/products/${product.slug}` : `/products/${product.slug}`}
        className="group block bg-card rounded-xl sm:rounded-2xl border border-border/60 overflow-hidden hover:border-primary/30 hover:shadow-md transition-all duration-200"
      >
        {/* Image */}
        <div className="relative aspect-square bg-secondary/40 overflow-hidden">
          {mainImage ? (
            <img
              src={mainImage.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}

          {/* Discount badge — top left */}
          {discountPercent && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none">
              -{discountPercent}%
            </span>
          )}

          {/* Wishlist — top right */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product.id); }}
            className={cn(
              'absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all',
              isWishlisted ? 'bg-white shadow-sm' : 'bg-white/0 hover:bg-white/80'
            )}
          >
            <Heart className={cn('w-3.5 h-3.5', isWishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground')} />
          </button>

          {/* Out of stock */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="text-xs text-muted-foreground font-medium bg-white px-3 py-1 rounded-full shadow-sm">
                Tugagan
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2 sm:p-3">
          {/* Name */}
          <p className="text-xs sm:text-sm text-foreground line-clamp-2 leading-snug mb-1.5 min-h-[2.4em]">
            {product.name}
          </p>

          {/* Price */}
          <div className="mb-2">
            <span className="text-sm sm:text-base font-bold text-foreground">
              {formatPrice(product.price)}
            </span>
            {product.old_price && product.old_price > product.price && (
              <span className="ml-1.5 text-xs text-muted-foreground line-through">
                {formatPrice(product.old_price)}
              </span>
            )}
          </div>

          {/* Cart control */}
          {isInCart && !hasVariants ? (
            <div className="flex items-center justify-between border border-primary rounded-xl overflow-hidden h-8">
              <button
                onClick={handleDecrement}
                className="w-8 h-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold text-primary">{quantity}</span>
              <button
                onClick={handleIncrement}
                disabled={quantity >= product.stock_qty}
                className="w-8 h-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={cn(
                'w-full h-8 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all',
                isOutOfStock
                  ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
              )}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {hasVariants ? 'Tanlash' : 'Savatga'}
            </button>
          )}
        </div>
      </Link>

      <VariantDrawer open={drawerOpen} onOpenChange={setDrawerOpen} product={product} onAddToCart={handleVariantAdd} />
      <AuthModal
        open={authModalOpen}
        onClose={() => { setAuthModalOpen(false); setPendingAction(null); }}
        onSuccess={() => { pendingAction?.(); setPendingAction(null); }}
      />
    </>
  );
}
