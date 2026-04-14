import { useParams } from 'react-router-dom';
import { StoreProvider } from '@/contexts/StoreContext';
import ProductDetail from '@/pages/ProductDetail';

export default function StoreProductDetail() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <StoreProvider storeSlug={slug}>
      <ProductDetail storeSlug={slug} />
    </StoreProvider>
  );
}
