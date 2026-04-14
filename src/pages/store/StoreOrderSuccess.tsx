import { useParams } from 'react-router-dom';
import { StoreProvider } from '@/contexts/StoreContext';
import OrderSuccess from '@/pages/OrderSuccess';

export default function StoreOrderSuccess() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <StoreProvider storeSlug={slug}>
      <OrderSuccess storeSlug={slug} />
    </StoreProvider>
  );
}
