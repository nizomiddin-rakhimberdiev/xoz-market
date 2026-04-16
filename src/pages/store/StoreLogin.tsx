import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { StoreProvider } from '@/contexts/StoreContext';
import { StoreHeader } from '@/components/store/StoreHeader';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function StoreLoginContent() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signIn, customer, isLoading: authLoading } = useCustomerAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && customer) {
      navigate(`/store/${slug}/account`);
    }
  }, [customer, authLoading, navigate, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await signIn(phone, password);
    setIsLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Xush kelibsiz!');
    navigate(`/store/${slug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-sm mx-auto">
          <h1 className="text-2xl font-display font-bold mb-2 text-center">Tizimga kirish</h1>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            Buyurtmalaringizni kuzatib boring
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Telefon raqam</Label>
              <Input
                placeholder="+998 90 123 45 67"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Parol</Label>
              <Input
                type="password"
                placeholder="Parolingiz"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? 'Yuklanmoqda...' : 'Kirish'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Akkauntingiz yo'qmi?{' '}
            <Link to={`/store/${slug}/register`} className="text-primary hover:underline font-medium">
              Ro'yxatdan o'ting
            </Link>
          </p>
          <p className="text-center text-sm text-muted-foreground mt-2">
            <Link to={`/store/${slug}`} className="hover:underline">
              ← Do'konga qaytish
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function StoreLogin() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <StoreProvider storeSlug={slug}>
      <StoreLoginContent />
    </StoreProvider>
  );
}
