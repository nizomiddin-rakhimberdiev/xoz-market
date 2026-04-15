import { useState, useEffect, useRef } from 'react';
import { Building2, Phone, MapPin, Mail, Globe, MessageCircle, Palette, Save, Upload, ImageIcon, X, Loader2, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { updateStore } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function StoreSettings() {
  const { userStore, refreshAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const storeUrl = userStore ? `${window.location.origin}/store/${userStore.slug}` : '';

  const handleCopyLink = () => {
    if (!storeUrl) return;
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File, type: 'logo' | 'banner') => {
    if (!userStore) return;
    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingBanner;
    setUploading(true);

    try {
      const ext = file.name.split('.').pop();
      const path = `${userStore.id}/${type}-${Date.now()}.${ext}`;

      const { data, error: uploadError } = await supabase.storage
        .from('store-assets')
        .upload(path, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('store-assets').getPublicUrl(data.path);
      const url = urlData.publicUrl;

      if (type === 'logo') {
        setLogoUrl(url);
      } else {
        setBannerUrl(url);
      }

      toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} yuklandi`);
    } catch (error: any) {
      toast.error('Yuklashda xatolik', { description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (userStore && !initialized) {
      setName(userStore.name);
      setDescription(userStore.description || '');
      setPhone(userStore.phone || '');
      setEmail(userStore.email || '');
      setAddress(userStore.address || '');
      setCity(userStore.city || '');
      setTelegramBotToken(userStore.telegram_bot_token || '');
      setTelegramChatId(userStore.telegram_chat_id || '');
      setPrimaryColor(userStore.theme_primary_color || '#2563eb');
      setLogoUrl(userStore.logo_url || '');
      setBannerUrl(userStore.banner_url || '');
      setInitialized(true);
    }
  }, [userStore, initialized]);

  const handleSave = async () => {
    if (!userStore) return;
    setIsLoading(true);

    try {
      await updateStore(userStore.id, {
        name,
        description: description || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        city: city || null,
        telegram_bot_token: telegramBotToken || null,
        telegram_chat_id: telegramChatId || null,
        theme_primary_color: primaryColor,
        logo_url: logoUrl || null,
        banner_url: bannerUrl || null,
      });

      // fonda yangilaymiz, kutmaymiz
      refreshAuth().catch(() => {});
      toast.success('Sozlamalar saqlandi');
    } catch (error: any) {
      toast.error('Saqlashda xatolik', {
        description: error.message || 'Qayta urinib ko\'ring',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!userStore) {
    return <div>Yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Do'kon sozlamalari</h1>
        <p className="text-muted-foreground">Do'koningiz ma'lumotlarini boshqaring</p>
      </div>

      {/* Do'kon havolasi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Do'kon havolasi
          </CardTitle>
          <CardDescription>Bu havolani mijozlaringizga yuboring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input value={storeUrl} readOnly className="bg-secondary/50 text-sm" />
            <Button type="button" variant="outline" size="icon" onClick={handleCopyLink}>
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </Button>
            <a href={storeUrl} target="_blank" rel="noopener noreferrer">
              <Button type="button" variant="outline" size="icon">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </div>
          {copied && <p className="text-xs text-success mt-2">Havola nusxalandi!</p>}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Asosiy ma'lumotlar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Asosiy ma'lumotlar
            </CardTitle>
            <CardDescription>Do'kon nomi va tavsifi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Do'kon nomi</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Do'kon manzili (URL)</Label>
              <Input value={userStore.slug} disabled className="bg-secondary/50" />
              <p className="text-xs text-muted-foreground">URL-ni o'zgartirish mumkin emas</p>
            </div>
            <div className="space-y-2">
              <Label>Tavsif</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Aloqa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Aloqa ma'lumotlari
            </CardTitle>
            <CardDescription>Mijozlaringiz uchun</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dokon@misol.uz" />
            </div>
            <div className="space-y-2">
              <Label>Shahar</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Toshkent" />
            </div>
            <div className="space-y-2">
              <Label>Manzil</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Chilonzor 9, 25-uy" />
            </div>
          </CardContent>
        </Card>

        {/* Logo va Banner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Logo va Banner
            </CardTitle>
            <CardDescription>Do'koningiz ko'rinishini yaxshilang</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="relative">
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="w-20 h-20 rounded-xl object-cover border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-secondary/50">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(file, 'logo');
                      e.target.value = '';
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="gap-2"
                  >
                    {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploadingLogo ? 'Yuklanmoqda...' : 'Logo yuklash'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">200x200px tavsiya etiladi</p>
                </div>
              </div>
            </div>

            {/* Banner */}
            <div className="space-y-2">
              <Label>Banner</Label>
              {bannerUrl ? (
                <div className="relative">
                  <img
                    src={bannerUrl}
                    alt="Banner"
                    className="w-full h-32 rounded-xl object-cover border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setBannerUrl('')}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-full h-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center bg-secondary/50 gap-2">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Banner rasmi</span>
                </div>
              )}
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file, 'banner');
                  e.target.value = '';
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
                className="gap-2"
              >
                {uploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadingBanner ? 'Yuklanmoqda...' : 'Banner yuklash'}
              </Button>
              <p className="text-xs text-muted-foreground">1200x300px tavsiya etiladi</p>
            </div>
          </CardContent>
        </Card>

        {/* Telegram */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Telegram bildirishnomalar
            </CardTitle>
            <CardDescription>Yangi buyurtmalar haqida xabar olish</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Bot Token</Label>
              <Input
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
                placeholder="1234567890:ABCdefGHIjklmNOPqrstUVwxyz"
                type="password"
              />
              <p className="text-xs text-muted-foreground">@BotFather dan olingan token</p>
            </div>
            <div className="space-y-2">
              <Label>Chat ID</Label>
              <Input
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="-1001234567890"
              />
              <p className="text-xs text-muted-foreground">Guruh yoki kanal ID-si</p>
            </div>
          </CardContent>
        </Card>

        {/* Mavzu */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Do'kon mavzusi
            </CardTitle>
            <CardDescription>Do'koningiz ko'rinishini sozlang</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Asosiy rang</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tarif rejasi</Label>
              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{userStore.subscription_plan}</span>
                  <span className="text-sm text-muted-foreground">
                    {userStore.max_products} ta mahsulot limiti
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading} className="gap-2">
          <Save className="w-4 h-4" />
          {isLoading ? 'Saqlanmoqda...' : 'Saqlash'}
        </Button>
      </div>
    </div>
  );
}
