import type { SettingsResponse } from "~/types/settings";
import { readLocalMemberSettings } from "~/utils/localMemberSettings";

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

export type MemberFormPickRequest = {
  priority: number;
  setlistId: number;
  desiredPosition: string;
  desiredExtra: string;
};

export type MemberFormAvailabilityRequest = {
  availableFrom: string;
  availableTo: string;
};

export type TeamFormPositionRequest = {
  position: string;
  proficiency: string;
};

export type TeamFormSaveRequest = {
  positions: TeamFormPositionRequest[];
  preferredTeammates: string;
  availabilities: MemberFormAvailabilityRequest[];
};

export type TeamFormSaveResponse = {
  savedPositionCount: number;
  savedAvailabilityCount: number;
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

  /** API 실패 시 관리자가 localStorage에 저장한 설정으로 폴백 */
  async function loadMemberSettings(): Promise<SettingsResponse | null> {
    try {
      return await fetchSettings();
    } catch {
      const local = readLocalMemberSettings();
      if (!local) return null;

      if (import.meta.dev) {
        console.warn(
          "[BandPick] settings API 실패 — localStorage(관리자 설정) 값을 사용합니다.",
        );
      }

      return {
        id: 0,
        updateTime: "",
        deadline: local.deadline,
        minVocalSongs: local.minVocalSongs,
        minSessionSongs: local.minSessionSongs,
      };
    }
  }

  async function submitMemberForm(body: MemberSubmissionRequest) {
    return await $fetch<MemberSubmissionResponse>(submissionUrl.value, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  }

  function teamFormUrl(userId: number) {
    return joinApiPath(config.public.apiBase, `users/${userId}/team-forms`);
  }

  async function submitTeamForm(userId: number, body: TeamFormSaveRequest) {
    return await $fetch<TeamFormSaveResponse>(teamFormUrl(userId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  }

  return {
    settingsUrl,
    submissionUrl,
    fetchSettings,
    loadMemberSettings,
    submitMemberForm,
    submitTeamForm,
  };
}
