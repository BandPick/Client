export type MemberFormPickRequest = {
  priority: number;
  setlistId: number;
  desiredPosition: string;
  desiredExtra?: string;
};

export type MemberFormAvailabilityRequest = {
  availableFrom: string;
  availableTo: string;
};

export type MemberFormSaveRequest = {
  userId: number;
  picks: MemberFormPickRequest[];
  availabilities: MemberFormAvailabilityRequest[];
};

export type MemberFormSaveResponse = {
  savedPickCount: number;
  savedAvailabilityCount: number;
  message: string;
};

export function useMemberFormApi() {
  const config = useRuntimeConfig();

  const apiBaseUrl = computed(() =>
    String(config.public.apiBase).replace(/\/$/, ""),
  );

  async function saveMemberForm(userId: number, payload: MemberFormSaveRequest) {
    return await $fetch<MemberFormSaveResponse>(
      `${apiBaseUrl.value}/users/${userId}/forms`,
      {
        method: "POST",
        body: payload,
      },
    );
  }

  return { saveMemberForm };
}
