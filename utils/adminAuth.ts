import supabase from './supabaseClient';

export interface Admin {
    id: string;
    email: string;
    full_name: string;
    role: string;
}

export async function getCurrentAdmin(): Promise<Admin | null> {
    try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session) return null;

        const { data: admin, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (adminError || !admin) return null;
        return admin as Admin;
    } catch (error) {
        console.error('خطأ في جلب بيانات المشرف:', error);
        return null;
    }
}

export async function isSupervisor(): Promise<boolean> {
    const admin = await getCurrentAdmin();
    return admin?.role === 'مشرف عام';
}

export async function getAllAdmins(): Promise<Admin[]> {
    try {
        const { data: admins, error } = await supabase
            .from('admins')
            .select('*')
            .order('full_name');

        if (error) throw error;
        return admins as Admin[];
    } catch (error) {
        console.error('خطأ في جلب قائمة المشرفين:', error);
        return [];
    }
}

export async function updateAdmin(adminData: Partial<Admin> & { id: string }): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('admins')
            .update(adminData)
            .eq('id', adminData.id);

        return !error;
    } catch (error) {
        console.error('خطأ في تحديث بيانات المشرف:', error);
        return false;
    }
}

export async function createAdmin(adminData: Omit<Admin, 'id'>): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('admins')
            .insert([adminData]);

        return !error;
    } catch (error) {
        console.error('خطأ في إنشاء مشرف جديد:', error);
        return false;
    }
}

export async function deleteAdmin(adminId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('admins')
            .delete()
            .eq('id', adminId);

        return !error;
    } catch (error) {
        console.error('خطأ في حذف المشرف:', error);
        return false;
    }
} 