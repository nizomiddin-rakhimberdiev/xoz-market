import { cn } from '@/lib/utils';
import type { ProductVariant } from '@/types/database';
import { formatPrice } from '@/lib/api';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onSelectVariant: (variant: ProductVariant | null) => void;
  basePrice: number;
  baseName: string;
  baseStock: number;
}

export function VariantSelector({
  variants,
  selectedVariant,
  onSelectVariant,
  basePrice,
  baseName,
  baseStock,
}: VariantSelectorProps) {
  const activeVariants = variants.filter((v) => v.is_active && v.stock_qty > 0);

  if (activeVariants.length === 0) return null;

  const baseAvailable = baseStock > 0;
  const isBaseSelected = selectedVariant === null;

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-muted-foreground">Variantni tanlang</h4>
      <div className="flex flex-wrap gap-2">
        {baseAvailable && (
          <button
            onClick={() => onSelectVariant(null)}
            className={cn(
              'px-4 py-2 rounded-xl border-2 transition-all text-sm font-medium',
              isBaseSelected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50'
            )}
          >
            <span>{baseName}</span>
            <span className="ml-2 text-xs opacity-75">
              {formatPrice(basePrice)}
            </span>
          </button>
        )}
        {activeVariants.map((variant) => {
          const price = variant.price_override ?? basePrice;
          const isSelected = selectedVariant?.id === variant.id;

          return (
            <button
              key={variant.id}
              onClick={() => onSelectVariant(variant)}
              className={cn(
                'px-4 py-2 rounded-xl border-2 transition-all text-sm font-medium',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <span>{variant.name}</span>
              <span className="ml-2 text-xs opacity-75">
                {formatPrice(price)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
