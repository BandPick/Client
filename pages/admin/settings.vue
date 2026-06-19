<template>
  <div>
    <h1 class="text-2xl font-bold">설정</h1>

    <div class="mt-8 max-w-2xl space-y-10">
      <div class="max-w-lg space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium">희망곡 신청 마감 일시</label>
          <div class="flex items-center gap-3">
            <input v-model="settings.deadline" type="datetime-local"
              class="w-full rounded-lg border border-slate-200 px-3 py-2" />
            <button
              class="whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              @click="saveDeadline">
              저장
            </button>
          </div>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">최소 희망 곡 수</label>

          <div class="flex gap-4">
            <div class="flex-1">
              <span class="text-sm text-slate-600">보컬</span>
              <input v-model.number="settings.minVocal" type="number" min="1"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
            </div>

            <div class="flex-1">
              <span class="text-sm text-slate-600">세션</span>
              <input v-model.number="settings.minSession" type="number" min="1"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
            </div>

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
import { onMounted } from "vue";
import { useSettingsApi } from "~/composables/useSettingsApi";
import { useSettingsStore } from "~/stores/settings";
import type { SettingsRequest } from "~/types/settings";
import {
  datetimeLocalToIsoDeadline,
  deadlineToDatetimeLocal,
} from "~/utils/settingsDeadline";

definePageMeta({
  layout: "admin",
});

useHead({
  title: "설정 — BandPick",
});

const settings = useSettingsStore();
const { settingsUrl, fetchSettings, saveSettings: saveSettingsToServer } =
  useSettingsApi();

onMounted(async () => {
  settings.hydrate();
  console.log("settings GET", settingsUrl.value);
  try {
    const data = await fetchSettings();
    console.log("settings GET response", data);
    settings.applyFromApi(
      data.minVocalSongs,
      data.minSessionSongs,
      deadlineToDatetimeLocal(data.deadline),
    );
  } catch (error) {
    console.warn(
      "settings GET skipped (서버 미기동·404 등). 로컬 값 사용:",
      error,
    );
  }
});

async function saveDeadline() {
  try {
    const payload: SettingsRequest = {
      deadline: datetimeLocalToIsoDeadline(settings.deadline),
      minVocalSongs: settings.minVocal,
      minSessionSongs: settings.minSession,
    };
    console.log("settings PUT (마감)", settingsUrl.value, payload);
    settings.setDeadline(settings.deadline);
    const response = await saveSettingsToServer(payload);
    console.log("settings PUT response", response);
    settings.applyFromApi(
      response.minVocalSongs,
      response.minSessionSongs,
      deadlineToDatetimeLocal(response.deadline),
    );
    window.alert("신청곡 마감 일시가 정상적으로 저장되었습니다.");
  } catch (error) {
    console.error("settings PUT failed (마감)", error);
    window.alert(
      "서버 저장은 실패했지만, 이 브라우저 localStorage에는 마감 일시가 저장되었습니다.",
    );
  }
}

async function saveSettings() {
  settings.setMinCounts(settings.minVocal, settings.minSession);
  try {
    const payload: SettingsRequest = {
      deadline: datetimeLocalToIsoDeadline(settings.deadline),
      minVocalSongs: settings.minVocal,
      minSessionSongs: settings.minSession,
    };
    console.log("settings PUT (최소 곡 수)", settingsUrl.value, payload);
    const response = await saveSettingsToServer(payload);
    console.log("settings PUT response", response);
    settings.applyFromApi(
      response.minVocalSongs,
      response.minSessionSongs,
      deadlineToDatetimeLocal(response.deadline),
    );
    window.alert("최소 곡 수 설정이 정상적으로 저장되었습니다.");
  } catch (error) {
    console.error("settings PUT failed (최소 곡 수)", error);
    window.alert(
      "서버 저장은 실패했지만, 이 브라우저 localStorage에는 최소 곡 수가 저장되었습니다.",
    );
  }
}
</script>