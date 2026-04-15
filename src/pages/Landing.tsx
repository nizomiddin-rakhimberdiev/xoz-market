import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  ArrowRight,
  Store,
  BarChart3,
  Smartphone,
  Zap,
  ShieldCheck,
  MessageCircle,
  MapPin,
  Phone,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getStores } from '@/lib/api';

export default function Landing() {
  const [storeSearch, setStoreSearch] = useState('');

  const { data: stores } = useQuery({
    queryKey: ['stores'],
    queryFn: getStores,
  });

  const filteredStores = stores?.filter((s) => {
    if (!storeSearch.trim()) return true;
    const q = storeSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
              <Building2 className="w-7 h-7" />
              <span>QurilishBozor</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost">Kirish</Button>
              </Link>
              <Link to="/register">
                <Button>Do'kon ochish</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 sm:py-24 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Qurilish mollaringizni <br className="hidden sm:block" />
            onlayn soting
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Qurilish mollari do'konlari uchun maxsus platforma. 5 daqiqada o'z onlayn do'koningizni yarating
            va sotuvlarni boshlang.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="gap-2 text-lg h-14 px-8">
                Bepul boshlash
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="text-lg h-14 px-8">
                Batafsil
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-center mb-12">
            Nima uchun QurilishBozor?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: '5 daqiqada tayyor',
                desc: 'Ro\'yxatdan o\'ting, do\'kon yarating, mahsulotlarni qo\'shing — tayyor!',
              },
              {
                icon: Store,
                title: 'Qurilish uchun maxsus',
                desc: 'Sement, g\'isht, armatora — qurilish mollari uchun tayyor kategoriyalar va o\'lchov birliklari.',
              },
              {
                icon: Smartphone,
                title: 'Mobil moslashuvchan',
                desc: 'Mijozlaringiz telefon, planshet yoki kompyuterdan bemalol xarid qilishlari mumkin.',
              },
              {
                icon: BarChart3,
                title: 'Moliyaviy analitika',
                desc: 'Daromad, foyda, eng ko\'p sotiladigan mahsulotlar — hamma narsa nazoringizda.',
              },
              {
                icon: MessageCircle,
                title: 'Telegram bildirishnomalar',
                desc: 'Har yangi buyurtma haqida darhol Telegram orqali xabar oling.',
              },
              {
                icon: ShieldCheck,
                title: 'Xavfsiz va ishonchli',
                desc: 'Ma\'lumotlaringiz himoyalangan. Server validatsiyasi va RLS xavfsizligi.',
              },
            ].map((feature, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border">
                <feature.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active stores */}
      {stores && stores.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-center mb-4">
              Faol do'konlar
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              Platformamizdagi do'konlarni ko'ring
            </p>
            <div className="max-w-md mx-auto mb-10 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                placeholder="Do'kon nomi yoki shahri bo'yicha qidiring..."
                className="pl-9"
              />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(filteredStores?.length === 0) ? (
                <div className="col-span-full text-center text-muted-foreground py-8">
                  Hech narsa topilmadi
                </div>
              ) : filteredStores?.slice(0, 6).map((store) => (
                <Link
                  key={store.id}
                  to={`/store/${store.slug}`}
                  className="bg-card rounded-2xl p-6 border border-border hover:border-primary/50 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {store.logo_url ? (
                      <img src={store.logo_url} alt={store.name} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-display font-bold group-hover:text-primary transition-colors">
                        {store.name}
                      </h3>
                      {store.city && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {store.city}
                        </p>
                      )}
                    </div>
                  </div>
                  {store.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {store.description}
                    </p>
                  )}
                  {store.phone && (
                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {store.phone}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-center mb-4">
            Tarif rejalari
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            O'zingizga mos tarifni tanlang
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: 'Free',
                price: 'Bepul',
                features: ['10 ta mahsulot', 'Asosiy analitika', 'Telegram bildirishnomalar'],
                cta: 'Boshlash',
                featured: false,
              },
              {
                name: 'Basic',
                price: '99,000 so\'m/oy',
                features: ['100 ta mahsulot', 'To\'liq analitika', 'Telegram bildirishnomalar', 'SMS bildirishnomalar'],
                cta: 'Tanlash',
                featured: true,
              },
              {
                name: 'Pro',
                price: '249,000 so\'m/oy',
                features: ['Cheksiz mahsulot', 'To\'liq analitika', 'Barcha bildirishnomalar', 'Maxsus domen', 'Ustuvor qo\'llab-quvvatlash'],
                cta: 'Tanlash',
                featured: false,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 border ${
                  plan.featured
                    ? 'border-primary bg-card shadow-lg scale-105'
                    : 'border-border bg-card'
                }`}
              >
                <h3 className="font-display font-bold text-lg mb-1">{plan.name}</h3>
                <p className="text-2xl font-bold mb-4">{plan.price}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="text-sm text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button
                    variant={plan.featured ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4">
            Hoziroq boshlang!
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            5 daqiqada o'z onlayn do'koningizni yarating va qurilish mollaringizni butun O'zbekistonga soting.
          </p>
          <Link to="/register">
            <Button size="lg" className="gap-2 text-lg h-14 px-8">
              Bepul do'kon ochish
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <span className="font-display font-bold">QurilishBozor</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Qurilish mollari do'konlari uchun SaaS platforma
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
