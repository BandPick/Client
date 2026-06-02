export type LoginRequest = {
  code: string;
  name: string;
};

export type LoginUser = {
  id: number;
  code: string;
  name: string;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  user: LoginUser | null;
};

const AUTH_USER_STORAGE_KEY = "bandpick-auth-user-v1";

export function useAuthApi() {
  const config = useRuntimeConfig();

  const authBaseUrl = computed(() => {
    const host = String(config.public.apiBase).replace(/\/$/, "");
    return `${host}/auth`;
  });

  async function login(payload: LoginRequest) {
    return await $fetch<LoginResponse>(`${authBaseUrl.value}/login`, {
      method: "POST",
      body: payload,
    });
  }

  function saveAuthUser(user: LoginUser) {
    if (!import.meta.client) return;
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  }

  function loadAuthUser(): LoginUser | null {
    if (!import.meta.client) return null;
    try {
      const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      if (
        parsed == null ||
        typeof parsed !== "object" ||
        typeof (parsed as LoginUser).id !== "number" ||
        typeof (parsed as LoginUser).name !== "string"
      ) {
        return null;
      }
      return parsed as LoginUser;
    } catch {
      return null;
    }
  }

  function clearAuthUser() {
    if (!import.meta.client) return;
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  }

  return { login, saveAuthUser, loadAuthUser, clearAuthUser };
}
