-- =============================================
-- STORAGE POLICIES: store_owner uchun rasm yuklash
-- =============================================

-- 1. Eski admin-only policylarni olib tashlash
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

-- 2. Store ownerlar uchun product-images bucket policylari
CREATE POLICY "Store owners can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'product-images'
    AND (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'store_owner')
    )
);

CREATE POLICY "Store owners can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'product-images'
    AND (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'store_owner')
    )
);

CREATE POLICY "Store owners can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'product-images'
    AND (
        public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'store_owner')
    )
);

-- 3. Store assets bucket (logo, banner)
INSERT INTO storage.buckets (id, name, public) VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public o'qish
CREATE POLICY "Store assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-assets');

-- Store ownerlar yuklashi mumkin
CREATE POLICY "Store owners can upload store assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'store-assets'
    AND public.has_role(auth.uid(), 'store_owner')
);

-- Store ownerlar yangilashi mumkin
CREATE POLICY "Store owners can update store assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'store-assets'
    AND public.has_role(auth.uid(), 'store_owner')
);

-- Store ownerlar o'chirishi mumkin
CREATE POLICY "Store owners can delete store assets"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'store-assets'
    AND public.has_role(auth.uid(), 'store_owner')
);
