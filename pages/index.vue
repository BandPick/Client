<template>
  <div class="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
    <section
      class="grid gap-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8 lg:grid-cols-2 lg:gap-10 lg:rounded-3xl lg:p-12">
      <div
        class="flex flex-col justify-center rounded-2xl bg-gradient-to-br from-blue-50 via-white to-slate-100 p-5 sm:p-8">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">BandPick</p>
        <h1 class="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
          밴드 공연 참여를
          <br class="hidden sm:block">
          더 빠르게 시작하세요.
        </h1>
        <p class="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
          역할에 맞는 로그인 정보를 입력하고, 부원/기획자 화면으로 바로 이동합니다.
        </p>
        <ul class="mt-6 space-y-2 text-sm text-slate-600">
          <li class="flex items-center gap-2">
            <span class="h-1.5 w-1.5 rounded-full bg-blue-500" />
            부원: 이름 + 고유코드 로그인
          </li>
          <li class="flex items-center gap-2">
            <span class="h-1.5 w-1.5 rounded-full bg-blue-500" />
            기획자: 밴드명 + 비밀번호 로그인
          </li>
          <li class="flex items-center gap-2">
            <span class="h-1.5 w-1.5 rounded-full bg-blue-500" />
            모바일에서도 입력이 쉬운 반응형 UI
          </li>
        </ul>
      </div>

      <form class="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 sm:p-8"
        @submit.prevent="handleSubmit">
        <p class="text-center text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Login</p>
        <h2 class="mt-2 text-center text-2xl font-bold tracking-tight text-slate-900">BandPick 입장</h2>
        <p class="mt-2 text-center text-sm text-slate-500">
          {{ role === "member" ? "이름과 고유코드를 입력해 로그인하세요." : "밴드명과 비밀번호를 입력해 로그인하세요." }}
        </p>

        <div class="mt-6 space-y-4">
          <div>
            <label for="identifier" class="mb-1 block text-sm font-medium text-slate-700">
              {{ role === "member" ? "이름" : "밴드명" }}
            </label>
            <input id="identifier" v-model.trim="identifier" type="text"
              :autocomplete="role === 'member' ? 'name' : 'organization'"
              :placeholder="role === 'member' ? '이름 입력' : '밴드명 입력'"
              class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
          </div>

          <div>
            <label for="secret" class="mb-1 block text-sm font-medium text-slate-700">
              {{ role === "member" ? "고유 코드 (학번/번호 뒷자리)" : "비밀번호" }}
            </label>
            <div class="relative">
              <input
                id="secret"
                v-model.trim="secret"
                :type="showSecret ? 'text' : 'password'"
                :autocomplete="role === 'member' ? 'off' : 'current-password'"
                :placeholder="role === 'member' ? '고유 코드 입력' : '비밀번호 입력'"
                class="w-full rounded-xl border border-slate-300 py-3 pl-4 pr-11 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                tabindex="-1"
                class="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                :aria-label="showSecret ? '입력값 숨기기' : '입력값 보기'"
                @click="showSecret = !showSecret"
              >
                <!-- 글자가 보일 때: 눈 감음(숨기기), 가려질 때: 눈 뜸(보기) -->
                <svg
                  v-if="showSecret"
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg
                  v-else
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M1 1l22 22"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          <fieldset>
            <legend class="mb-2 text-sm font-medium text-slate-700">역할 선택</legend>
            <div class="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              <button type="button" class="rounded-lg px-3 py-2 text-sm font-semibold transition"
                :class="role === 'member' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                @click="role = 'member'">
                일반 부원
              </button>
              <button type="button" class="rounded-lg px-3 py-2 text-sm font-semibold transition"
                :class="role === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                @click="role = 'admin'">
                기획자
              </button>
            </div>
          </fieldset>
        </div>

        <p v-if="errorMessage"
          class="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {{ errorMessage }}
        </p>

        <button type="submit" :disabled="submitting"
          class="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">
          {{ submitting ? "로그인 중..." : "로그인" }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
type Role = "member" | "admin";

const identifier = ref("");
const secret = ref("");
const showSecret = ref(false);
const role = ref<Role>("member");
const errorMessage = ref("");
const submitting = ref(false);
const { login, saveAuthUser } = useAuthApi();
const config = useRuntimeConfig();

function isLoginNetworkError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const err = error as { message?: string; statusCode?: number; cause?: unknown };
  if (err.statusCode === 0) return true;
  const msg = String(err.message ?? "").toLowerCase();
  return (
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("failed to fetch") ||
    msg.includes("econnrefused")
  );
}

function validateForm() {
  if (!identifier.value || !secret.value) {
    return role.value === "member"
      ? "이름과 고유 코드를 모두 입력해 주세요."
      : "밴드명과 비밀번호를 모두 입력해 주세요.";
  }
  return "";
}

async function handleSubmit() {
  errorMessage.value = "";
  const validationError = validateForm();
  if (validationError) {
    errorMessage.value = validationError;
    return;
  }

  submitting.value = true;
  try {
    if (role.value === "member") {
      const response = await login({
        name: identifier.value,
        code: secret.value,
      });

      if (!response.success || !response.user) {
        errorMessage.value = response.message || "로그인에 실패했습니다.";
        return;
      }

      saveAuthUser(response.user);
      await navigateTo("/member");
      return;
    }

    // 기획자 인증은 별도 구현 전까지 기존 더미 라우팅 유지
    await navigateTo("/admin");
  } catch (error) {
    if (import.meta.dev && role.value === "member" && isLoginNetworkError(error)) {
      console.warn(
        "[BandPick] 로그인 API에 연결되지 않아 개발 모드에서 /member로 이동합니다.",
      );
      await navigateTo("/member");
      return;
    }

    const apiBase = String(config.public.apiBase);
    if (isLoginNetworkError(error)) {
      errorMessage.value = `백엔드 서버에 연결할 수 없습니다. Spring Boot가 실행 중인지 확인해 주세요. (요청 주소: ${apiBase}/api/v1/auth/login)`;
      return;
    }

    const err = error as { data?: { message?: string }; message?: string };
    errorMessage.value =
      err.data?.message ||
      err.message ||
      "서버 통신 중 오류가 발생했습니다.";
  } finally {
    submitting.value = false;
  }
}

useHead({
  title: "BandPick 로그인",
});
</script>
