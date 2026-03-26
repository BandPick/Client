<template>
  <div>
    <h1 class="text-2xl font-bold">설정</h1>
    <p class="mt-1 text-slate-600">
      마감 시간, 최소 곡 수, 공연 셋리스트 등을 설정합니다.
    </p>

    <div class="mt-8 max-w-2xl space-y-10">
      <div class="max-w-lg space-y-4">
        <div class="flex items-end gap-3">
          <div class="flex-1">
            <label class="mb-1 block text-sm font-medium">마감 일시</label>
            <input v-model="draft.deadline" type="datetime-local"
              class="w-full rounded-lg border border-slate-200 px-3 py-2" />
          </div>

          <button class="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            @click="saveSettings">
            저장
          </button>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">최소 희망 곡 수</label>

          <div class="flex gap-4">
            <!-- 보컬 -->
            <div class="flex-1">
              <span class="text-sm text-slate-600">보컬</span>
              <input v-model.number="draft.minVocal" type="number" min="1"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
            </div>

            <!-- 세션 -->
            <div class="flex-1">
              <span class="text-sm text-slate-600">세션</span>
              <input v-model.number="draft.minSession" type="number" min="1"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
            </div>

            <!-- 저장 버튼 -->
            <button class="mt-7 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              @click="saveSettings">
              저장
            </button>
          </div>
        </div>
      </div>

      <AdminSetlistEditor />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from "~/stores/settings";

definePageMeta({
  layout: "admin",
});

useHead({
  title: "설정 — BandPick",
});

const settings = useSettingsStore();
const draft = reactive({
  minVocal: 1,
  minSession: 1,
  deadline: "",
});

onMounted(() => {
  settings.hydrate();
  draft.minVocal = settings.minVocal;
  draft.minSession = settings.minSession;
  draft.deadline = settings.deadline;
});

function saveSettings() {
  settings.setMinCounts(draft.minVocal, draft.minSession);
  settings.setDeadline(draft.deadline);
}
</script>