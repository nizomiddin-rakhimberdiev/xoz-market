import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Package, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    if (!storeSlug || customer) {
      action();
    } else {
      setPendingAction(() => action);
      setAuthModalOpen(true);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(() => {
      if (hasVariants) {
        setDrawerOpen(true);
      } else {
        addItem({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: mainImage?.image_url,
          stepQty: product.step_qty,
          minOrderQty: product.min_order_qty,
          stockQty: product.stock_qty,
        });
      }
    });
  };

  const handleVariantAdd = (variant: ProductVariant) => {
    const price = variant.price_override ?? product.price;
    addItem({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      variantName: variant.name,
      price,
      image: mainImage?.image_url,
      stepQty: product.step_qty,
      minOrderQty: product.min_order_qty,
      stockQty: variant.stock_qty,
    });
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(() => incrementQuantity(product.id));
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity <= product.min_order_qty) removeItem(product.id);
    else decrementQuantity(product.id);
  };

  return (
    <>
      <Link
        to={storeSlug ? `/store/${storeSlug}/products/${product.slug}` : `/products/${product.slug}`}
        className="group block bg-card rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
      >
        {/* Image */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {mainImage ? (
            <img
              src={mainImage.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground/40" />
            </div>
          )}

          {/* Top badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discountPercent && (
              <span className="bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md">
                -{discountPercent}%
              </span>
            )}
            {hasVariants && (
              <span className="bg-primary/90 text-primary-foreground text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded-md">
                {activeVariants.length} xil
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product.id); }}
            className={cn(
              'absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10',
              isWishlisted
                ? 'bg-red-50 shadow-sm'
                : 'bg-background/70 opacity-0 group-hover:opacity-100 backdrop-blur-sm'
            )}
          >
            <Heart className={cn('w-3.5 h-3.5 transition-colors', isWishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground')} />
          </button>

          {/* Out of stock */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground bg-background/90 px-3 py-1.5 rounded-full">
                Tugagan
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2.5 sm:p-3">
          <h3 className="text-xs sm:text-sm font-medium text-foreground line-clamp-2 leading-snug mb-2 group-hover:text-primary transition-colors min-h-[2.5em]">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-1.5 mb-2.5">
            <span className="text-sm sm:text-base font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            {product.old_price && product.old_price > product.price && (
              <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                {formatPrice(product.old_price)}
              </span>
            )}
          </div>

          {/* Cart button */}
          {isInCart && !hasVariants ? (
            <div className="flex items-center justify-between bg-primary/10 rounded-xl px-1 py-0.5">
              <button
                onClick={handleDecrement}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-primary hover:bg-primary/20 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold text-primary min-w-[1.5rem] text-center">{quantity}</span>
              <button
                onClick={handleIncrement}
                disabled={quantity >= product.stock_qty}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={cn(
                'w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all',
                isOutOfStock
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]'
              )}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {hasVariants ? 'Tanlash' : 'Savatga'}
            </button>
          )}
        </div>
      </Link>

      <VariantDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        product={product}
        onAddToCart={handleVariantAdd}
      />

      <AuthModal
        open={authModalOpen}
        onClose={() => { setAuthModalOpen(false); setPendingAction(null); }}
        onSuccess={() => { pendingAction?.(); setPendingAction(null); }}
      />
    </>
  );
}
