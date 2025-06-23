-- إنشاء جدول الملفات الشخصية
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- إنشاء جدول المشرفين
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('مشرف عام', 'مشرف')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- إنشاء سياسات الأمان للملفات الشخصية
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المستخدمون يمكنهم عرض ملفاتهم الشخصية" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "المستخدمون يمكنهم تحديث ملفاتهم الشخصية" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- إنشاء سياسات الأمان للمشرفين
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المشرفون يمكنهم عرض بياناتهم" ON public.admins
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "المشرف العام يمكنه عرض جميع المشرفين" ON public.admins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE id = auth.uid() AND role = 'مشرف عام'
        )
    );

-- إنشاء الوظائف المساعدة
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء المشغل لإضافة المستخدمين الجدد تلقائياً
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 