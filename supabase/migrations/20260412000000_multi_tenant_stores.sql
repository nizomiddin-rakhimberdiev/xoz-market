-- =============================================
-- MULTI-TENANT SaaS MIGRATION
-- stores jadvali, store_id ustunlari, yangi rollar
-- =============================================

-- 1. app_role enum-ga store_owner qo'shish
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'store_owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'platform_admin';

-- 2. product_unit enum-ga qurilish mollari uchun yangi birliklar
ALTER TYPE public.product_unit ADD VALUE IF NOT EXISTS 'tonna';
ALTER TYPE public.product_unit ADD VALUE IF NOT EXISTS 'metr';
ALTER TYPE public.product_unit ADD VALUE IF NOT EXISTS 'metr2';
ALTER TYPE public.product_unit ADD VALUE IF NOT EXISTS 'metr3';
ALTER TYPE public.product_unit ADD VALUE IF NOT EXISTS 'litr';
ALTER TYPE public.product_unit ADD VALUE IF NOT EXISTS 'qop';
ALTER TYPE public.product_unit ADD VALUE IF NOT EXISTS 'rulon';
ALTER TYPE public.product_unit ADD VALUE IF NOT EXISTS 'komplekt';

-- 3. Subscription plan enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'basic', 'pro');
CREATE TYPE public.store_status AS ENUM ('active', 'inactive', 'suspended', 'pending');

-- 4. STORES jadvali — asosiy tenant jadvali
CREATE TABLE public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    telegram_bot_token TEXT,
    telegram_chat_id TEXT,
    theme_primary_color TEXT DEFAULT '#2563eb',
    theme_secondary_color TEXT DEFAULT '#64748b',
    subscription_plan subscription_plan DEFAULT 'free',
    store_status store_status DEFAULT 'pending',
    max_products INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. store_members — do'kon xodimlari (kelajak uchun)
CREATE TABLE public.store_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'manager',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(store_id, user_id)
);

-- 6. Mavjud jadvallarga store_id qo'shish
ALTER TABLE public.categories ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

-- 7. Indekslar
CREATE INDEX idx_stores_slug ON public.stores(slug);
CREATE INDEX idx_stores_owner ON public.stores(owner_id);
CREATE INDEX idx_stores_status ON public.stores(store_status);
CREATE INDEX idx_store_members_store ON public.store_members(store_id);
CREATE INDEX idx_store_members_user ON public.store_members(user_id);
CREATE INDEX idx_categories_store ON public.categories(store_id);
CREATE INDEX idx_products_store ON public.products(store_id);
CREATE INDEX idx_orders_store ON public.orders(store_id);

-- 8. Updated_at trigger for stores
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. RLS enable
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;

-- 10. has_store_access funksiyasi — do'kon egasi yoki a'zosi tekshirish
CREATE OR REPLACE FUNCTION public.has_store_access(_user_id UUID, _store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.stores WHERE id = _store_id AND owner_id = _user_id
        UNION ALL
        SELECT 1 FROM public.store_members WHERE store_id = _store_id AND user_id = _user_id
    )
$$;

-- 11. get_user_store funksiyasi — user-ning do'konini olish
CREATE OR REPLACE FUNCTION public.get_user_store(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.stores WHERE owner_id = _user_id LIMIT 1
$$;

-- =============================================
-- YANGILANGAN RLS SIYOSATLARI
-- =============================================

-- STORES policies
CREATE POLICY "Active stores are viewable by everyone"
    ON public.stores FOR SELECT
    USING (is_active = true AND store_status = 'active');

CREATE POLICY "Store owners can view own store"
    ON public.stores FOR SELECT TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "Store owners can update own store"
    ON public.stores FOR UPDATE TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create stores"
    ON public.stores FOR INSERT TO authenticated
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Platform admins can manage all stores"
    ON public.stores FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'platform_admin'));

-- STORE_MEMBERS policies
CREATE POLICY "Store owners can manage members"
    ON public.store_members FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid()));

CREATE POLICY "Members can view own membership"
    ON public.store_members FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- CATEGORIES: eski policy-larni olib, yangilarini qo'shish
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

CREATE POLICY "Categories are viewable by store"
    ON public.categories FOR SELECT
    USING (is_active = true AND store_id IS NOT NULL);

CREATE POLICY "Store owners can manage own categories"
    ON public.categories FOR ALL TO authenticated
    USING (public.has_store_access(auth.uid(), store_id));

CREATE POLICY "Platform admins can manage all categories"
    ON public.categories FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'platform_admin'));

-- PRODUCTS: eski policy-larni olib, yangilarini qo'shish
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Products are viewable by store"
    ON public.products FOR SELECT
    USING (is_active = true AND store_id IS NOT NULL);

CREATE POLICY "Store owners can manage own products"
    ON public.products FOR ALL TO authenticated
    USING (public.has_store_access(auth.uid(), store_id));

CREATE POLICY "Platform admins can manage all products"
    ON public.products FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'platform_admin'));

-- PRODUCT_VARIANTS: eski policy-larni olib, yangilarini qo'shish
DROP POLICY IF EXISTS "Variants are viewable by everyone" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can manage variants" ON public.product_variants;

CREATE POLICY "Variants are viewable by everyone"
    ON public.product_variants FOR SELECT
    USING (is_active = true);

CREATE POLICY "Store owners can manage own variants"
    ON public.product_variants FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = product_id AND public.has_store_access(auth.uid(), p.store_id)
    ));

CREATE POLICY "Platform admins can manage all variants"
    ON public.product_variants FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'platform_admin'));

-- PRODUCT_IMAGES: eski policy-larni olib, yangilarini qo'shish
DROP POLICY IF EXISTS "Images are viewable by everyone" ON public.product_images;
DROP POLICY IF EXISTS "Admins can manage images" ON public.product_images;

CREATE POLICY "Images are viewable by everyone"
    ON public.product_images FOR SELECT
    USING (true);

CREATE POLICY "Store owners can manage own images"
    ON public.product_images FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = product_id AND public.has_store_access(auth.uid(), p.store_id)
    ));

CREATE POLICY "Platform admins can manage all images"
    ON public.product_images FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'platform_admin'));

-- ORDERS: eski policy-larni olib, yangilarini qo'shish
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

CREATE POLICY "Anyone can create orders"
    ON public.orders FOR INSERT
    WITH CHECK (store_id IS NOT NULL);

CREATE POLICY "Store owners can view own orders"
    ON public.orders FOR SELECT TO authenticated
    USING (public.has_store_access(auth.uid(), store_id));

CREATE POLICY "Store owners can update own orders"
    ON public.orders FOR UPDATE TO authenticated
    USING (public.has_store_access(auth.uid(), store_id));

CREATE POLICY "Platform admins can manage all orders"
    ON public.orders FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'platform_admin'));

-- ORDER_ITEMS: eski policy-larni olib, yangilarini qo'shish
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view order items" ON public.order_items;

CREATE POLICY "Anyone can create order items"
    ON public.order_items FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Store owners can view own order items"
    ON public.order_items FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id AND public.has_store_access(auth.uid(), o.store_id)
    ));

CREATE POLICY "Platform admins can manage all order items"
    ON public.order_items FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'platform_admin'));

-- USER_ROLES: Platform admin policy qo'shish
CREATE POLICY "Platform admins can manage all roles"
    ON public.user_roles FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'platform_admin'));

-- 12. Order number generatsiyasi store prefix bilan
CREATE OR REPLACE FUNCTION public.generate_store_order_number(_store_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    store_slug TEXT;
    prefix TEXT;
    new_number TEXT;
BEGIN
    SELECT UPPER(LEFT(slug, 3)) INTO store_slug FROM public.stores WHERE id = _store_id;
    IF store_slug IS NULL THEN
        prefix := 'XOZ';
    ELSE
        prefix := store_slug;
    END IF;
    new_number := prefix || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN new_number;
END;
$$;

-- 13. Realtime for stores
ALTER PUBLICATION supabase_realtime ADD TABLE public.stores;
