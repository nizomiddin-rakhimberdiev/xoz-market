import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === 'Email not confirmed') {
          toast.error('Email tasdiqlanmagan', {
            description: 'Emailingizga yuborilgan tasdiq havolasini bosing',
          });
        } else {
          toast.error('Kirish xatoligi', {
            description: error.message,
          });
        }
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        toast.error('Kirish xatoligi');
        setIsLoading(false);
        return;
      }

      toast.success('Xush kelibsiz!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error('Xatolik', {
        description: error.message || 'Kutilmagan xatolik',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl p-8 shadow-lg">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Building2 className="w-10 h-10 text-primary" />
            <span className="font-display text-2xl font-bold">QurilishBozor</span>
          </div>

          <h1 className="text-2xl font-display font-bold text-center mb-2">
            Hisobga kirish
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Do'koningizni boshqaring
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@misol.uz"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Parolingiz"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? 'Kirish...' : 'Kirish'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Hisobingiz yo'qmi?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Ro'yxatdan o'tish
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
