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

  return {
    user,
    isAdmin:
      user?.type === UserRole.ADMIN || user?.type === UserRole.SUPER_ADMIN,
    isSuperAdmin: user?.type === UserRole.SUPER_ADMIN,
    isProgrammer: user?.type === UserRole.PROGRAMMER,
    isModerator: user?.type === UserRole.MODERATOR,
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
