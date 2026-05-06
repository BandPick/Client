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

  return { login };
}
