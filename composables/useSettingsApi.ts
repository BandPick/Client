import type { SettingsRequest, SettingsResponse } from "~/types/settings";

export function useSettingsApi() {
  const config = useRuntimeConfig();

  const settingsUrl = computed(() => {
    const host = String(config.public.apiBase).replace(/\/$/, "");
    return `${host}/api/v1/settings`;
  });

  function base(): string {
    return settingsUrl.value;
  }

  async function fetchSettings(): Promise<SettingsResponse> {
    return await $fetch<SettingsResponse>(base(), {
      method: "GET",
    });
  }

  async function saveSettings(
    body: SettingsRequest,
  ): Promise<SettingsResponse> {
    return await $fetch<SettingsResponse>(base(), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body,
    });
  }

  return {
    settingsUrl,
    fetchSettings,
    saveSettings,
  };
}
