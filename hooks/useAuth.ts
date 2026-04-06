import { usePlatformAuthStore } from "@/store/platformAuthStore";
import { UserRole } from "@/types/userRole";

export function useAuth() {
  const {
    user,
    token,
    isLoggedIn,
    loading,
    error,
    login,
    logout,
    hydrated,
    initialized,
    fetchProfile,
    initializeFromStorage,
  } = usePlatformAuthStore();

  const isAdmin =
    user?.type === UserRole.ADMIN || user?.type === UserRole.SUPER_ADMIN;
  const isModerator = user?.type === UserRole.MODERATOR;
  const isOperator = user?.type === UserRole.OPERATOR;
  // طاقم الكنترول روم = أدمن + مشرف + مشغّل + مبرمج
  const isControlRoomStaff =
    isAdmin ||
    isModerator ||
    isOperator ||
    user?.type === UserRole.PROGRAMMER;

  return {
    user,
    isAdmin,
    isSuperAdmin: user?.type === UserRole.SUPER_ADMIN,
    isProgrammer: user?.type === UserRole.PROGRAMMER,
    isModerator,
    isOperator,
    isControlRoomStaff,
    hydrated,
    initialized,
    isReady: hydrated,
    isLoading: loading,
    login,
    logout,
    fetchProfile,
    initializeFromStorage,
    token,
    isLoggedIn,
    error,
  };
}

export default useAuth;
