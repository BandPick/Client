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

export type AdminLoginRequest = {
  username: string;
  password: string;
};

export type AdminLoginResponse = {
  success: boolean;
  message: string;
};

export type MemberAuthSession = {
  role: "member";
  id: number;
  code: string;
  name: string;
};

export type AdminAuthSession = {
  role: "admin";
  username: string;
};

export type AuthSession = MemberAuthSession | AdminAuthSession;

const AUTH_SESSION_STORAGE_KEY = "bandpick-auth-session-v1";
/** @deprecated 이전 키 — 마이그레이션용 */
const LEGACY_AUTH_USER_STORAGE_KEY = "bandpick-auth-user-v1";

export function useAuthApi() {
  const config = useRuntimeConfig();

  const authBaseUrl = computed(() => {
    const host = String(config.public.apiBase).replace(/\/$/, "");
    return `${host}/api/v1/auth`;
  });

  async function login(payload: LoginRequest) {
    return await $fetch<LoginResponse>(`${authBaseUrl.value}/login`, {
      method: "POST",
      body: payload,
    });
  }

  async function register(payload: LoginRequest) {
    return await $fetch<LoginResponse>(`${authBaseUrl.value}/register`, {
      method: "POST",
      body: payload,
    });
  }

  async function adminLogin(payload: AdminLoginRequest) {
    return await $fetch<AdminLoginResponse>(`${authBaseUrl.value}/admin/login`, {
      method: "POST",
      body: payload,
    });
  }

  function saveAuthSession(session: AuthSession) {
    if (!import.meta.client) return;
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
    localStorage.removeItem(LEGACY_AUTH_USER_STORAGE_KEY);
  }

  function saveAuthUser(user: LoginUser) {
    saveAuthSession({
      role: "member",
      id: user.id,
      code: user.code,
      name: user.name,
    });
  }

  function saveAdminSession(username: string) {
    saveAuthSession({
      role: "admin",
      username,
    });
  }

  function loadAuthSession(): AuthSession | null {
    if (!import.meta.client) return null;
    try {
      const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (isAuthSession(parsed)) return parsed;
      }

      // 이전 member 세션 마이그레이션
      const legacyRaw = localStorage.getItem(LEGACY_AUTH_USER_STORAGE_KEY);
      if (!legacyRaw) return null;
      const legacy = JSON.parse(legacyRaw) as unknown;
      if (
        legacy != null &&
        typeof legacy === "object" &&
        typeof (legacy as LoginUser).id === "number" &&
        typeof (legacy as LoginUser).name === "string" &&
        typeof (legacy as LoginUser).code === "string"
      ) {
        const migrated: MemberAuthSession = {
          role: "member",
          id: (legacy as LoginUser).id,
          code: (legacy as LoginUser).code,
          name: (legacy as LoginUser).name,
        };
        saveAuthSession(migrated);
        return migrated;
      }
      return null;
    } catch {
      return null;
    }
  }

  function loadAuthUser(): LoginUser | null {
    const session = loadAuthSession();
    if (!session || session.role !== "member") return null;
    return { id: session.id, code: session.code, name: session.name };
  }

  function isAdminAuthenticated(): boolean {
    const session = loadAuthSession();
    return session?.role === "admin";
  }

  function clearAuthSession() {
    if (!import.meta.client) return;
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    localStorage.removeItem(LEGACY_AUTH_USER_STORAGE_KEY);
  }

  function clearAuthUser() {
    clearAuthSession();
  }

  return {
    login,
    register,
    adminLogin,
    saveAuthUser,
    saveAdminSession,
    saveAuthSession,
    loadAuthUser,
    loadAuthSession,
    isAdminAuthenticated,
    clearAuthUser,
    clearAuthSession,
  };
}

function isAuthSession(value: unknown): value is AuthSession {
  if (value == null || typeof value !== "object") return false;
  const role = (value as { role?: unknown }).role;
  if (role === "admin") {
    return typeof (value as AdminAuthSession).username === "string";
  }
  if (role === "member") {
    return (
      typeof (value as MemberAuthSession).id === "number" &&
      typeof (value as MemberAuthSession).code === "string" &&
      typeof (value as MemberAuthSession).name === "string"
    );
  }
  return false;
}
