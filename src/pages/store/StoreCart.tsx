import { useParams } from 'react-router-dom';
import { StoreProvider } from '@/contexts/StoreContext';
import Cart from '@/pages/Cart';

export default function StoreCart() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <StoreProvider storeSlug={slug}>
      <Cart storeSlug={slug} />
    </StoreProvider>
  );
}
