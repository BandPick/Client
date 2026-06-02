import type { SettingsResponse } from "~/types/settings";

export type MemberPickRequest = {
  priority: number;
  songId: number;
  sessions: string[];
};

export type MemberSubmissionRequest = {
  picks: MemberPickRequest[];
  availableSlots: string[];
};

export type MemberSubmissionResponse = {
  success: boolean;
  message?: string;
};

function joinApiPath(base: string, pathWithoutPrefix: string): string {
  const cleanBase = String(base).replace(/\/$/, "");
  const cleanPath = String(pathWithoutPrefix).replace(/^\/+/, "");
  if (/(^|\/)api\/v1$/.test(cleanBase)) {
    return `${cleanBase}/${cleanPath}`;
  }
  return `${cleanBase}/api/v1/${cleanPath}`;
}

export function useMemberFormApi() {
  const config = useRuntimeConfig();

  const settingsUrl = computed(() =>
    joinApiPath(config.public.apiBase, "settings"),
  );

  const submissionUrl = computed(() => {
    const path =
      (config.public as { apiMemberSubmissionPath?: string })
        .apiMemberSubmissionPath ?? "members/submissions";
    return joinApiPath(config.public.apiBase, path);
  });

  async function fetchSettings() {
    return await $fetch<SettingsResponse>(settingsUrl.value, {
      method: "GET",
    });
  }

  async function submitMemberForm(body: MemberSubmissionRequest) {
    return await $fetch<MemberSubmissionResponse>(submissionUrl.value, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  }

  return {
    settingsUrl,
    submissionUrl,
    fetchSettings,
    submitMemberForm,
  };
}
