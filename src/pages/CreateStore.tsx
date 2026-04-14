import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Store, MapPin, Phone, FileText, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createStore, generateSlug } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function CreateStore() {
  const navigate = useNavigate();
  const { user, refreshAuth } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Toshkent');

  useEffect(() => {
    if (!user) {
      navigate('/register');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (name) {
      setSlug(generateSlug(name));
    }
  }, [name]);

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error('Do\'kon nomini kiriting');
      return;
    }

    setIsLoading(true);
    try {
      await createStore({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
      });

      refreshAuth().catch(() => {});
      toast.success('Do\'koningiz yaratildi!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error('Xatolik', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-card rounded-2xl p-8 shadow-lg">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Building2 className="w-10 h-10 text-primary" />
            <span className="font-display text-2xl font-bold">QurilishBozor</span>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 2 && <div className={`w-12 h-0.5 ${step > 1 ? 'bg-primary' : 'bg-secondary'}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <>
              <h2 className="text-xl font-display font-bold text-center mb-2">
                Do'kon ma'lumotlari
              </h2>
              <p className="text-muted-foreground text-center mb-6 text-sm">
                Do'koningiz haqida asosiy ma'lumotlarni kiriting
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Do'kon nomi *</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Masalan: Baraka Qurilish Mollari"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Do'kon manzili (URL)</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">qurilishbozor.uz/store/</span>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="baraka-qurilish"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Tavsif</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Do'koningiz haqida qisqa tavsif..."
                      className="pl-10 min-h-[80px]"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  className="w-full h-12"
                  disabled={!name.trim() || !slug.trim()}
                >
                  Davom etish
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-display font-bold text-center mb-2">
                Aloqa ma'lumotlari
              </h2>
              <p className="text-muted-foreground text-center mb-6 text-sm">
                Mijozlaringiz siz bilan bog'lanishi uchun
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon raqam</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Shahar</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Toshkent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Manzil</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Chilonzor 9, 25-uy"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 h-12"
                  >
                    Orqaga
                  </Button>
                  <Button
                    onClick={handleCreate}
                    className="flex-1 h-12"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Yaratilmoqda...' : 'Do\'kon yaratish'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
