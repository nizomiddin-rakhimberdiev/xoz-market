import { useParams } from 'react-router-dom';
import { StoreProvider } from '@/contexts/StoreContext';
import Checkout from '@/pages/Checkout';

export default function StoreCheckout() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <StoreProvider storeSlug={slug}>
      <Checkout storeSlug={slug} />
    </StoreProvider>
  );
}
