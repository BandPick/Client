<template>
  <div>
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">대시보드</h1>
        <p class="mt-1 text-sm text-slate-500">
          부원 희망곡·가능시간 폼 제출 현황입니다.
        </p>
      </div>
      <button type="button"
        class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isLoading" @click="loadSubmissionStatus">
        {{ isLoading ? "불러오는 중..." : "새로고침" }}
      </button>
    </div>

    <p v-if="errorMessage" class="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {{ errorMessage }}
    </p>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">전체 부원</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">{{ summary.total }}</p>
      </div>
      <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700">제출 완료</p>
        <p class="mt-2 text-3xl font-bold text-emerald-800">{{ summary.submitted }}</p>
      </div>
      <div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-amber-700">미제출</p>
        <p class="mt-2 text-3xl font-bold text-amber-800">{{ summary.pending }}</p>
      </div>
      <div class="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-indigo-700">제출률</p>
        <p class="mt-2 text-3xl font-bold text-indigo-800">{{ summary.rateLabel }}</p>
      </div>
    </div>

    <div class="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
      <div class="h-full rounded-full bg-emerald-500 transition-all" :style="{ width: `${summary.rate}%` }" />
    </div>

    <p v-if="deadlineLabel" class="mt-3 text-sm text-slate-500">
      신청 마감: <span class="font-medium text-slate-700">{{ deadlineLabel }}</span>
    </p>

    <div class="mt-10">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-slate-900">제출 현황 한눈에 보기</h2>
        <div class="flex flex-wrap items-center gap-2">
          <input v-model.trim="searchQuery" type="search" placeholder="이름 또는 학번 검색"
            class="w-48 rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
          <select v-model="statusFilter" class="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
            <option value="all">전체</option>
            <option value="submitted">제출 완료</option>
            <option value="pending">미제출</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="min-w-[720px] w-full border-collapse text-sm">
          <thead class="bg-slate-50 text-slate-700">
            <tr>
              <th class="border-b border-slate-200 px-4 py-3 text-left font-semibold">학번</th>
              <th class="border-b border-slate-200 px-4 py-3 text-left font-semibold">이름</th>
              <th class="border-b border-slate-200 px-4 py-3 text-left font-semibold">상태</th>
              <th class="border-b border-slate-200 px-4 py-3 text-left font-semibold">희망곡 수</th>
              <th class="border-b border-slate-200 px-4 py-3 text-left font-semibold">희망곡 / 세션</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="5" class="px-4 py-10 text-center text-slate-400">
                제출 현황을 불러오는 중...
              </td>
            </tr>
            <tr v-else-if="!filteredRows.length">
              <td colspan="5" class="px-4 py-10 text-center text-slate-400">
                표시할 부원이 없습니다.
              </td>
            </tr>
            <tr v-for="row in filteredRows" :key="row.userId" class="align-top hover:bg-slate-50">
              <td class="border-b border-slate-100 px-4 py-3 text-slate-600">
                {{ row.code }}
              </td>
              <td class="border-b border-slate-100 px-4 py-3 font-medium text-slate-900">
                {{ row.name }}
              </td>
              <td class="border-b border-slate-100 px-4 py-3">
                <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" :class="row.submitted
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
                  ">
                  {{ row.submitted ? "제출 완료" : "미제출" }}
                </span>
              </td>
              <td class="border-b border-slate-100 px-4 py-3 text-slate-700">
                {{ row.submitted ? row.picks.length : "-" }}
              </td>
              <td class="border-b border-slate-100 px-4 py-3 text-slate-600">
                <template v-if="row.submitted && row.picks.length">
                  <ul class="space-y-0.5">
                    <li v-for="(pick, index) in row.picks" :key="`${row.userId}-${index}`">
                      {{ pick }}
                    </li>
                  </ul>
                </template>
                <span v-else class="text-slate-400">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

useHead({
  title: "제출 현황 — BandPick",
});

type UserInfo = {
  id: number;
  code: string;
  name: string;
};

type FormPickItem = {
  priority: number;
  songTitle: string;
  session: string;
};

type FormMember = {
  userId: number;
  name: string;
  picks: FormPickItem[];
};

type SubmissionRow = {
  userId: number;
  code: string;
  name: string;
  submitted: boolean;
  picks: string[];
};

const config = useRuntimeConfig();
const { fetchSettings } = useSettingsApi();

const isLoading = ref(false);
const errorMessage = ref("");
const rows = ref<SubmissionRow[]>([]);
const searchQuery = ref("");
const statusFilter = ref<"all" | "submitted" | "pending">("all");
const deadlineLabel = ref("");

const usersApiUrl = computed(() => {
  const host = String(config.public.apiBase).replace(/\/$/, "");
  return `${host}/api/v1/users`;
});

const formsApiUrl = computed(() => {
  const host = String(config.public.apiBase).replace(/\/$/, "");
  return `${host}/api/v1/forms`;
});

const summary = computed(() => {
  const total = rows.value.length;
  const submitted = rows.value.filter((row) => row.submitted).length;
  const pending = total - submitted;
  const rate = total === 0 ? 0 : Math.round((submitted / total) * 100);
  return {
    total,
    submitted,
    pending,
    rate,
    rateLabel: `${rate}%`,
  };
});

const filteredRows = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return rows.value.filter((row) => {
    if (statusFilter.value === "submitted" && !row.submitted) return false;
    if (statusFilter.value === "pending" && row.submitted) return false;
    if (!query) return true;
    return (
      row.name.toLowerCase().includes(query) ||
      row.code.toLowerCase().includes(query)
    );
  });
});

function formatDeadline(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function loadSubmissionStatus() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const [users, forms] = await Promise.all([
      $fetch<UserInfo[]>(usersApiUrl.value, { method: "GET" }),
      $fetch<FormMember[]>(formsApiUrl.value, { method: "GET" }),
    ]);

    const formByUserId = new Map(
      forms.map((form) => [form.userId, form] as const),
    );

    rows.value = [...users]
      .map((user) => {
        const form = formByUserId.get(user.id);
        return {
          userId: user.id,
          code: user.code,
          name: user.name,
          submitted: Boolean(form && form.picks?.length),
          picks: (form?.picks ?? []).map(
            (pick) => `${pick.priority}. ${pick.songTitle} / ${pick.session}`,
          ),
        };
      })
      .sort((a, b) => {
        if (a.submitted !== b.submitted) return a.submitted ? 1 : -1;
        return a.name.localeCompare(b.name, "ko");
      });

    try {
      const settings = await fetchSettings();
      deadlineLabel.value = formatDeadline(settings.deadline);
    } catch {
      deadlineLabel.value = "";
    }
  } catch {
    errorMessage.value =
      "제출 현황을 불러오지 못했습니다. BandPick 서버와 API 경로를 확인해주세요.";
    rows.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadSubmissionStatus();
});
</script>