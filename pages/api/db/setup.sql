-- تفعيل RLS على جدول المشرفين
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسة القراءة
CREATE POLICY "المشرفون يمكنهم رؤية سجلاتهم فقط" ON public.admins
    FOR SELECT
    USING (
        auth.uid() = id 
        OR 
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE id = auth.uid() 
            AND role = 'مشرف عام'
        )
    );

-- إنشاء سياسة التعديل
CREATE POLICY "المشرفون يمكنهم تعديل بياناتهم فقط" ON public.admins
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- إنشاء سياسة الإضافة (فقط للمشرف العام)
CREATE POLICY "المشرف العام يمكنه إضافة مشرفين جدد" ON public.admins
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE id = auth.uid() 
            AND role = 'مشرف عام'
        )
    );

-- إنشاء سياسة الحذف (فقط للمشرف العام)
CREATE POLICY "المشرف العام يمكنه حذف المشرفين" ON public.admins
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE id = auth.uid() 
            AND role = 'مشرف عام'
        )
    );

-- إنشاء دالة للتحقق من صلاحيات المشرف
CREATE OR REPLACE FUNCTION public.is_admin_supervisor()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins
        WHERE id = auth.uid()
        AND role = 'مشرف عام'
    );
END;
$$; 