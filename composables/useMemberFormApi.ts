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
  level: string;
  priority: number;
};

export type TeamFormScheduleRequest = {
  dayOfWeek: string;
  startTime: string;
};

export type TeamFormSaveRequest = {
  message: string;
  maxTeams: number;
  positions: TeamFormPositionRequest[];
  schedules: TeamFormScheduleRequest[];
};

export type TeamFormSaveResponse = {
  savedPositionCount: number;
  savedScheduleCount: number;
  message?: string;
};

export type MemberFormSavePayload = {
  picks: MemberFormPickRequest[];
  availabilities: MemberFormAvailabilityRequest[];
};

export type MemberFormSaveResponse = {
  savedPickCount: number;
  savedAvailabilityCount: number;
  message?: string;
};

export type MemberFormPickResponse = {
  priority: number;
  songTitle: string;
  session: string;
  setlistId: number;
};

export type MemberFormAvailabilityResponse = {
  availableFrom: string;
  availableTo: string;
};

export type MemberFormDetailResponse = {
  userId: number;
  picks: MemberFormPickResponse[];
  availabilities: MemberFormAvailabilityResponse[];
};

export type TeamFormMemberResponse = {
  userId: number;
  name: string;
  code: string;
  message: string;
  maxTeams: number;
  createdAt: string;
  positions: TeamFormPositionRequest[];
  schedules: TeamFormScheduleRequest[];
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

  function memberFormUrl(userId: number) {
    return joinApiPath(config.public.apiBase, `users/${userId}/forms`);
  }

  function teamFormUrl(userId: number) {
    return joinApiPath(config.public.apiBase, `users/${userId}/team-forms`);
  }

  async function submitMemberForm(userId: number, body: MemberFormSavePayload) {
    return await $fetch<MemberFormSaveResponse>(memberFormUrl(userId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        userId,
        picks: body.picks,
        availabilities: body.availabilities,
      },
    });
  }

  async function loadMemberForm(userId: number) {
    return await $fetch<MemberFormDetailResponse>(memberFormUrl(userId), {
      method: "GET",
    });
  }

  async function submitTeamForm(userId: number, body: TeamFormSaveRequest) {
    return await $fetch<TeamFormSaveResponse>(teamFormUrl(userId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  }

  async function loadTeamForm(userId: number) {
    try {
      return await $fetch<TeamFormMemberResponse>(teamFormUrl(userId), {
        method: "GET",
      });
    } catch (error) {
      const err = error as {
        statusCode?: number;
        status?: number;
        response?: { status?: number };
      };
      const status = err.statusCode ?? err.status ?? err.response?.status;
      if (status === 404) return null;
      throw error;
    }
  }

  return {
    settingsUrl,
    submissionUrl,
    fetchSettings,
    loadMemberSettings,
    submitMemberForm,
    loadMemberForm,
    submitTeamForm,
    loadTeamForm,
  };
}