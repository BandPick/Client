<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="open"
        class="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/35 px-4 py-4 backdrop-blur-[2px] sm:items-center sm:py-6"
        role="dialog" aria-modal="true" :aria-labelledby="titleId" @click.self="close">
        <div
          class="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <button type="button"
            class="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-sm text-slate-500 hover:bg-slate-200"
            aria-label="닫기" @click="close">
            ✕
          </button>

          <div class="border-b border-slate-200 px-5 py-4 pr-12 sm:px-6">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
              팀제 매칭
            </p>
            <h2 :id="titleId" class="mt-1 text-lg font-bold text-slate-900">
              팀 매칭 결과
            </h2>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            <p v-if="loading" class="py-10 text-center text-sm text-slate-500">
              소속 팀을 불러오는 중...
            </p>
            <p v-else-if="errorMessage"
              class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {{ errorMessage }}
            </p>
            <p v-else-if="!teams.length"
              class="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              아직 배정된 팀이 없습니다. 기획자가 팀 매칭을 저장하면 확인할 수 있습니다.
            </p>
            <div v-else class="space-y-3">
              <article v-for="team in teams" :key="team.name" class="rounded-xl border bg-white p-4 shadow-sm"
                :class="team.confirmed ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-slate-200'">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <h3 class="font-semibold text-slate-900">
                      {{ team.name }}
                    </h3>
                    <p v-if="team.myPositions.length" class="mt-0.5 text-xs text-slate-500">
                      나의 세션 : {{ team.myPositions.join(" · ") }}
                    </p>
                  </div>
                  <span v-if="team.confirmed"
                    class="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    확정
                  </span>
                </div>

                <div class="mt-3 space-y-1.5">
                  <div v-for="(slot, slotIndex) in team.slots" :key="`${team.name}-${slot.position}-${slotIndex}`"
                    class="flex items-center gap-2">
                    <span
                      class="w-12 shrink-0 rounded bg-slate-100 px-1 py-1 text-center text-xs font-semibold text-slate-600">
                      {{ slot.position }}
                    </span>
                    <span v-if="slot.name"
                      class="flex min-w-0 flex-1 items-center justify-between rounded-md px-2.5 py-1 text-sm font-medium text-slate-900"
                      :class="slot.me ? 'bg-sky-300' : 'bg-sky-100'">
                      <span class="min-w-0 truncate">
                        {{ slot.name }}
                      </span>
                      <span v-if="slot.me"
                        class="ml-2 shrink-0 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        나
                      </span>
                    </span>
                    <span v-else-if="!slot.needed"
                      class="flex min-w-0 flex-1 items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-400">
                      필요없음
                    </span>
                    <span v-else
                      class="flex min-w-0 flex-1 items-center justify-center rounded-md border border-dashed border-slate-300 px-2.5 py-1 text-xs text-slate-400">
                      배정 필요
                    </span>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div class="border-t border-slate-100 px-5 py-4 sm:px-6">
            <button v-if="teams.length" type="button"
              class="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="savingImage" @click="downloadImage">
              {{ savingImage ? "저장 중..." : "이미지로 저장" }}
            </button>
            <button v-else type="button"
              class="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              @click="close">
              닫기
            </button>
            <p v-if="saveError" class="mt-2 text-center text-xs text-rose-600">
              {{ saveError }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useMemberFormApi } from "~/composables/useMemberFormApi";
import {
  downloadMemberTeamCards,
  type MemberTeamCard,
} from "~/utils/memberTeamCardImage";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const titleId = useId();
const { loadAuthUser } = useAuthApi();
const { loadMemberTeamAssignments } = useMemberFormApi();

const loading = ref(false);
const savingImage = ref(false);
const errorMessage = ref("");
const saveError = ref("");
const teams = ref<MemberTeamCard[]>([]);

function close() {
  emit("close");
}

function onEscape(event: KeyboardEvent) {
  if (event.key === "Escape" && props.open) {
    close();
  }
}

async function loadTeams() {
  loading.value = true;
  errorMessage.value = "";
  saveError.value = "";
  teams.value = [];

  const user = loadAuthUser();
  if (!user) {
    errorMessage.value = "로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.";
    loading.value = false;
    return;
  }

  try {
    const response = await loadMemberTeamAssignments(user.id);
    teams.value = (response.teams ?? []).map((team) => ({
      name: team.name,
      confirmed: Boolean(team.confirmed),
      myPositions: team.myPositions ?? [],
      slots: (team.slots ?? []).map((slot) => ({
        position: slot.position,
        needed: Boolean(slot.needed),
        userId: slot.userId,
        name: slot.name,
        level: slot.level ?? "",
        me: Boolean(slot.me),
      })),
    }));
  } catch {
    errorMessage.value =
      "소속 팀을 불러오지 못했습니다. 네트워크와 서버 상태를 확인해 주세요.";
  } finally {
    loading.value = false;
  }
}

async function downloadImage() {
  if (!teams.value.length || savingImage.value) {
    return;
  }
  savingImage.value = true;
  saveError.value = "";
  const filename =
    teams.value.length === 1
      ? `BandPick-${teams.value[0]!.name || "소속팀"}.jpg`
      : "BandPick-소속팀.jpg";
  try {
    await downloadMemberTeamCards(teams.value, filename);
  } catch {
    saveError.value = "이미지를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  } finally {
    savingImage.value = false;
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (!import.meta.client) return;
    if (isOpen) {
      window.addEventListener("keydown", onEscape);
      void loadTeams();
    } else {
      window.removeEventListener("keydown", onEscape);
    }
  },
);

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener("keydown", onEscape);
  }
});
</script>
