import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { toast } from 'sonner';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useCustomerAuth();

  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    phone: '', firstName: '', lastName: '', password: '', confirmPassword: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await signIn(loginForm.phone, loginForm.password);
    setIsLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Xush kelibsiz!');
    onClose();
    onSuccess?.();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Parollar mos kelmaydi');
      return;
    }
    if (registerForm.password.length < 6) {
      toast.error('Parol kamida 6 ta belgi bo\'lishi kerak');
      return;
    }
    setIsLoading(true);
    const result = await signUp(
      registerForm.phone,
      registerForm.firstName,
      registerForm.lastName,
      registerForm.password,
    );
    setIsLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Muvaffaqiyatli ro\'yxatdan o\'tdingiz!');
    onClose();
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {tab === 'login' ? 'Tizimga kirish' : 'Ro\'yxatdan o\'tish'}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-border mb-4">
          <button
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'login' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
            onClick={() => setTab('login')}
          >
            Kirish
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'register' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
            onClick={() => setTab('register')}
          >
            Ro'yxatdan o'tish
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Telefon raqam</Label>
              <Input
                placeholder="+998 90 123 45 67"
                value={loginForm.phone}
                onChange={e => setLoginForm({ ...loginForm, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Parol</Label>
              <Input
                type="password"
                placeholder="Parolingiz"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Yuklanmoqda...' : 'Kirish'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Akkauntingiz yo'qmi?{' '}
              <button type="button" className="text-primary hover:underline" onClick={() => setTab('register')}>
                Ro'yxatdan o'ting
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Ism</Label>
                <Input
                  placeholder="Ism"
                  value={registerForm.firstName}
                  onChange={e => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Familiya</Label>
                <Input
                  placeholder="Familiya"
                  value={registerForm.lastName}
                  onChange={e => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Telefon raqam</Label>
              <Input
                placeholder="+998 90 123 45 67"
                value={registerForm.phone}
                onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Parol</Label>
              <Input
                type="password"
                placeholder="Kamida 6 ta belgi"
                value={registerForm.password}
                onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Parolni tasdiqlang</Label>
              <Input
                type="password"
                placeholder="Parolni qaytaring"
                value={registerForm.confirmPassword}
                onChange={e => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Yuklanmoqda...' : 'Ro\'yxatdan o\'tish'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Allaqachon akkauntingiz bormi?{' '}
              <button type="button" className="text-primary hover:underline" onClick={() => setTab('login')}>
                Kiring
              </button>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
