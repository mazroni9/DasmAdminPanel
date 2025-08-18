import supabase from './supabaseClient';

export interface Admin {
    id: string;
    email: string;
    full_name: string;
    role: string;
}

export async function getCurrentAdmin(): Promise<Admin | null> {
    try {
        // استخدام بيانات محاكاة بدلاً من Supabase
        return {
            id: '1',
            email: 'admin@dasm-e.com',
            full_name: 'مشرف النظام',
            role: 'admin'
        };
    } catch (error) {
        console.error('خطأ في جلب بيانات المشرف:', error);
        return {
            id: '1',
            email: 'admin@dasm-e.com',
            full_name: 'مشرف النظام',
            role: 'admin'
        };
    }
}

export async function isSupervisor(): Promise<boolean> {
    const admin = await getCurrentAdmin();
    return admin?.role === 'مشرف عام';
}

export async function getAllAdmins(): Promise<Admin[]> {
    try {
        // استخدام بيانات محاكاة
        return [
            {
                id: '1',
                email: 'admin@dasm-e.com',
                full_name: 'مشرف النظام',
                role: 'admin'
            },
            {
                id: '2',
                email: 'supervisor@dasm-e.com',
                full_name: 'مشرف عام',
                role: 'مشرف عام'
            }
        ];
    } catch (error) {
        console.error('خطأ في جلب قائمة المشرفين:', error);
        return [];
    }
}

export async function updateAdmin(adminData: Partial<Admin> & { id: string }): Promise<boolean> {
    try {
        console.log('تحديث بيانات المشرف:', adminData);
        return true;
    } catch (error) {
        console.error('خطأ في تحديث بيانات المشرف:', error);
        return false;
    }
}

export async function createAdmin(adminData: Omit<Admin, 'id'>): Promise<boolean> {
    try {
        console.log('إنشاء مشرف جديد:', adminData);
        return true;
    } catch (error) {
        console.error('خطأ في إنشاء مشرف جديد:', error);
        return false;
    }
}

export async function deleteAdmin(adminId: string): Promise<boolean> {
    try {
        console.log('حذف المشرف:', adminId);
        return true;
    } catch (error) {
        console.error('خطأ في حذف المشرف:', error);
        return false;
    }
} 