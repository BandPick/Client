<template>
 <div class="space-y-6">
  <div>
   <h1 class="text-2xl font-bold">부원 정보 관리</h1>
  </div>

  <form class="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4"
   @submit.prevent="handleCreateUser">
   <div>
    <label class="mb-1 block text-xs font-semibold text-slate-600">학번(code)</label>
    <input v-model.trim="createForm.code" type="text" maxlength="20"
     class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="예: 20231234">
   </div>
   <div>
    <label class="mb-1 block text-xs font-semibold text-slate-600">이름</label>
    <input v-model.trim="createForm.name" type="text"
     class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="이름 입력">
   </div>
   <div class="md:col-span-2 flex items-end gap-2">
    <button type="submit"
     class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
     :disabled="isCreating">
     {{ isCreating ? "추가 중..." : "회원 추가" }}
    </button>
   </div>
  </form>

  <div class="flex flex-wrap items-center justify-between gap-3">
   <span v-if="isLoading" class="text-sm text-slate-500">부원 정보를 자동으로 불러오는 중...</span>
   <div class="flex flex-wrap items-center gap-2 text-sm">
    <label for="sort-by" class="text-slate-600">정렬</label>
    <select id="sort-by" v-model="sortBy" class="rounded-md border border-slate-300 px-2 py-1.5">
     <option value="code">학번</option>
     <option value="name">이름</option>
    </select>
    <button type="button"
     class="rounded-md border border-slate-300 px-2 py-1.5 text-slate-700 transition hover:bg-slate-50"
     @click="toggleSortOrder">
     {{ sortOrder === "asc" ? "오름차순" : "내림차순" }}
    </button>
   </div>
  </div>

  <p v-if="errorMessage" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
   {{ errorMessage }}
  </p>

  <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
   <table class="min-w-[560px] w-full table-fixed border-collapse text-sm">
    <thead class="bg-slate-50 text-slate-700">
     <tr>
      <th class="border-b border-slate-200 px-4 py-3 text-left font-semibold">학번(code)</th>
      <th class="border-b border-slate-200 px-4 py-3 text-left font-semibold">이름</th>
      <th class="border-b border-slate-200 px-4 py-3 text-left font-semibold">관리</th>
     </tr>
    </thead>
    <tbody>
     <tr v-if="!isLoading && !users.length">
      <td colspan="3" class="px-4 py-10 text-center text-slate-400">조회된 부원 정보가 없습니다.</td>
     </tr>
     <tr v-for="user in pagedUsers" :key="user.id" class="hover:bg-slate-50">
      <td class="border-b border-slate-100 px-4 py-3">
       <input v-model.trim="editForms[user.id].code" type="text" maxlength="20"
        class="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
      </td>
      <td class="border-b border-slate-100 px-4 py-3">
       <input v-model.trim="editForms[user.id].name" type="text"
        class="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
      </td>
      <td class="border-b border-slate-100 px-4 py-3">
       <div class="flex items-center gap-2">
        <button type="button"
         class="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
         :disabled="savingUserId === user.id || deletingUserId === user.id" @click="handleUpdateUser(user.id)">
         {{ savingUserId === user.id ? "저장 중..." : "저장" }}
        </button>
        <button type="button"
         class="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
         :disabled="savingUserId === user.id || deletingUserId === user.id" @click="handleDeleteUser(user.id)">
         {{ deletingUserId === user.id ? "삭제 중..." : "삭제" }}
        </button>
       </div>
      </td>
     </tr>
    </tbody>
   </table>
  </div>

  <div v-if="users.length" class="flex flex-wrap items-center justify-end gap-2">
   <button type="button"
    class="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    :disabled="currentPage === 1" @click="goToPrevPage">
    이전
   </button>
   <span class="text-sm text-slate-600">{{ currentPage }} / {{ totalPages }}</span>
   <button type="button"
    class="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    :disabled="currentPage === totalPages" @click="goToNextPage">
    다음
   </button>
  </div>
 </div>
</template>

<script setup lang="ts">
definePageMeta({
 layout: "admin",
});

useHead({
 title: "부원 정보 관리 — BandPick",
});

type UserInfo = {
 id: number;
 code: string;
 name: string;
};

const config = useRuntimeConfig();
const users = ref<UserInfo[]>([]);
const isLoading = ref(false);
const isCreating = ref(false);
const savingUserId = ref<number | null>(null);
const deletingUserId = ref<number | null>(null);
const errorMessage = ref("");
const currentPage = ref(1);
const pageSize = ref(10);
const sortBy = ref<"code" | "name">("code");
const sortOrder = ref<"asc" | "desc">("asc");
const createForm = ref({
 code: "",
 name: "",
});
const editForms = ref<Record<number, { code: string; name: string }>>({});

const totalPages = computed(() => Math.max(1, Math.ceil(users.value.length / pageSize.value)));
const sortedUsers = computed(() => {
 const list = [...users.value];
 const factor = sortOrder.value === "asc" ? 1 : -1;
 return list.sort((a, b) => {
  const left = String(a[sortBy.value]).toLowerCase();
  const right = String(b[sortBy.value]).toLowerCase();
  return left.localeCompare(right, "ko") * factor;
 });
});
const pagedUsers = computed(() => {
 const start = (currentPage.value - 1) * pageSize.value;
 return sortedUsers.value.slice(start, start + pageSize.value);
});
const startRow = computed(() => {
 if (!users.value.length) return 0;
 return (currentPage.value - 1) * pageSize.value + 1;
});
const endRow = computed(() => Math.min(currentPage.value * pageSize.value, users.value.length));

const usersApiUrl = computed(() => {
 const host = String(config.public.apiBase).replace(/\/$/, "");
 return `${host}/api/v1/users`;
});

async function loadUsers() {
 isLoading.value = true;
 errorMessage.value = "";

 try {
  const data = await $fetch<UserInfo[]>(usersApiUrl.value, { method: "GET" });
  users.value = data;
  syncEditForms();
 } catch {
  errorMessage.value = "부원 정보를 불러오지 못했습니다. 서버 상태와 API 경로를 확인해주세요.";
 } finally {
  isLoading.value = false;
 }
}

function syncEditForms() {
 const next: Record<number, { code: string; name: string }> = {};
 users.value.forEach((user) => {
  next[user.id] = { code: user.code, name: user.name };
 });
 editForms.value = next;
}

function goToPrevPage() {
 if (currentPage.value > 1) {
  currentPage.value -= 1;
 }
}

function goToNextPage() {
 if (currentPage.value < totalPages.value) {
  currentPage.value += 1;
 }
}

function toggleSortOrder() {
 sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
}

function validatePayload(code: string, name: string): string | null {
 if (!code) return "학번(code)을 입력해주세요.";
 if (!name) return "이름을 입력해주세요.";
 if (code.length > 20) return "학번(code)은 20자를 넘을 수 없습니다.";
 return null;
}

async function handleCreateUser() {
 const error = validatePayload(createForm.value.code, createForm.value.name);
 if (error) {
  errorMessage.value = error;
  return;
 }

 isCreating.value = true;
 errorMessage.value = "";

 try {
  await $fetch(usersApiUrl.value, {
   method: "POST",
   body: {
    code: createForm.value.code,
    name: createForm.value.name,
   },
  });

  createForm.value = { code: "", name: "" };
  await loadUsers();
 } catch (error) {
  errorMessage.value = toErrorMessage(error, "회원 추가에 실패했습니다.");
 } finally {
  isCreating.value = false;
 }
}

async function handleUpdateUser(userId: number) {
 const form = editForms.value[userId];
 if (!form) return;

 const error = validatePayload(form.code, form.name);
 if (error) {
  errorMessage.value = error;
  return;
 }

 savingUserId.value = userId;
 errorMessage.value = "";

 try {
  await $fetch(`${usersApiUrl.value}/${userId}`, {
   method: "PUT",
   body: {
    code: form.code,
    name: form.name,
   },
  });
  await loadUsers();
 } catch (error) {
  errorMessage.value = toErrorMessage(error, "회원 수정에 실패했습니다.");
 } finally {
  savingUserId.value = null;
 }
}

async function handleDeleteUser(userId: number) {
 if (!window.confirm("정말 이 회원 정보를 삭제할까요?")) return;

 deletingUserId.value = userId;
 errorMessage.value = "";

 try {
  await $fetch(`${usersApiUrl.value}/${userId}`, {
   method: "DELETE",
  });
  await loadUsers();
 } catch (error) {
  errorMessage.value = toErrorMessage(error, "회원 삭제에 실패했습니다.");
 } finally {
  deletingUserId.value = null;
 }
}

function toErrorMessage(error: unknown, fallback: string): string {
 if (error && typeof error === "object" && "data" in error) {
  const data = (error as { data?: unknown }).data;
  if (typeof data === "string" && data) {
   return data;
  }
 }
 return fallback;
}

onMounted(() => {
 loadUsers();
});

watch([users, pageSize], () => {
 if (currentPage.value > totalPages.value) {
  currentPage.value = totalPages.value;
 }
 if (currentPage.value < 1) {
  currentPage.value = 1;
 }
});

watch([sortBy, sortOrder], () => {
 currentPage.value = 1;
});
</script>