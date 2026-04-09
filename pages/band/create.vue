<template>
  <div class="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
          Band Create
        </p>
        <h1 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          새로운 밴드 그룹 생성
        </h1>
      </div>

      <form class="mt-6 space-y-5" @submit.prevent="handleCreateBand">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label for="bandName" class="mb-1 block text-sm font-medium text-slate-700">
              밴드명
            </label>
            <input
              id="bandName"
              v-model.trim="bandName"
              type="text"
              autocomplete="organization"
              placeholder="밴드명 입력"
              class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              @input="updateFieldErrors"
            >
            <p v-if="bandNameError" class="mt-1 text-sm text-rose-600">
              {{ bandNameError }}
            </p>
          </div>

          <div>
            <label for="password" class="mb-1 block text-sm font-medium text-slate-700">
              비밀번호
            </label>
            <input
              id="password"
              v-model.trim="password"
              type="password"
              autocomplete="new-password"
              placeholder="비밀번호 입력"
              class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              @input="updateFieldErrors"
            >
          </div>

          <div>
            <label for="confirmPassword" class="mb-1 block text-sm font-medium text-slate-700">
              비밀번호 재확인
            </label>
            <input
              id="confirmPassword"
              v-model.trim="confirmPassword"
              type="password"
              autocomplete="new-password"
              placeholder="비밀번호 재입력"
              class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              @input="updateFieldErrors"
            >
            <p v-if="passwordMismatchError" class="mt-1 text-sm text-rose-600">
              {{ passwordMismatchError }}
            </p>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 p-4 sm:p-5">
          <div class="mb-3 flex items-center justify-between gap-2">
            <h2 class="text-base font-semibold text-slate-800 sm:text-lg">
              멤버 정보 입력
            </h2>
            <div class="flex items-center gap-2">
              <button
                v-if="isSelectionMode"
                type="button"
                class="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="selectedMemberIds.length === 0"
                @click="removeSelectedMembers"
              >
                삭제
              </button>
              <button
                type="button"
                class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                @click="toggleSelectionMode"
              >
                {{ isSelectionMode ? "취소" : "선택" }}
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <article
              v-for="member in members"
              :key="member.id"
              class="relative rounded-xl border p-4 transition"
              :class="[
                member.selected
                  ? 'border-slate-500 bg-slate-100'
                  : 'border-slate-200 bg-white',
                isSelectionMode ? 'cursor-pointer' : '',
              ]"
              @click="handleMemberCardClick(member.id)"
            >
              <button
                type="button"
                class="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center text-sm text-slate-500 transition hover:text-rose-600"
                @click.stop="removeMember(member.id)"
              >
                x
              </button>

              <div class="grid gap-3 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700">
                    학번
                  </label>
                  <input
                    v-model.trim="member.studentId"
                    type="text"
                    placeholder="학번 입력"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    @input="ensureTrailingEmptyMember"
                  >
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700">
                    이름
                  </label>
                  <input
                    v-model.trim="member.name"
                    type="text"
                    autocomplete="name"
                    placeholder="이름 입력"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    @input="ensureTrailingEmptyMember"
                  >
                </div>
              </div>

              <div
                v-if="member.selected"
                class="mt-3 flex items-center justify-end text-xs font-semibold text-slate-600"
              >
                <span class="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1">
                  <span>✓</span>
                  <span>선택됨</span>
                </span>
              </div>
            </article>
          </div>

          <p class="mt-3 text-right text-xs text-slate-400">
            {{ completedMemberCount }}명
          </p>
        </div>

        <p
          v-if="errorMessage"
          class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600"
        >
          {{ errorMessage }}
        </p>
        <p
          v-else-if="successMessage"
          class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
        >
          {{ successMessage }}
        </p>

        <button
          type="submit"
          class="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
        >
          밴드 생성
        </button>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
type MemberInput = {
  id: number;
  studentId: string;
  name: string;
  selected: boolean;
};

const bandName = ref("");
const password = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");
const successMessage = ref("");
const isSelectionMode = ref(false);
const bandNameError = ref("");
const passwordMismatchError = ref("");
const existingBandNames = ["BandPick", "NewTune", "BlueRhythm", "DittoBand"];

let memberIdSeed = 1;

function createEmptyMember(): MemberInput {
  return {
    id: memberIdSeed++,
    studentId: "",
    name: "",
    selected: false,
  };
}

const members = ref<MemberInput[]>([createEmptyMember()]);

const completedMemberCount = computed(() => {
  return members.value.filter((member) => {
    return member.studentId.trim() && member.name.trim();
  }).length;
});

const selectedMemberIds = computed(() => {
  return members.value.filter((member) => member.selected).map((member) => member.id);
});

function isMemberFilled(member: MemberInput) {
  return Boolean(member.studentId.trim() && member.name.trim());
}

function isBandNameTaken(name: string) {
  const normalizedName = name.trim().toLowerCase();
  if (!normalizedName) return false;
  return existingBandNames.some((band) => band.trim().toLowerCase() === normalizedName);
}

function updateFieldErrors() {
  bandNameError.value = isBandNameTaken(bandName.value)
    ? "이미 존재하는 밴드명입니다"
    : "";
  const hasPasswordInput = Boolean(password.value.trim() || confirmPassword.value.trim());
  passwordMismatchError.value =
    hasPasswordInput && password.value !== confirmPassword.value
      ? "비밀번호가 일치하지 않습니다"
      : "";
}

function ensureTrailingEmptyMember() {
  const hasCompletedMember = members.value.some((member) => isMemberFilled(member));
  const hasEmptyMember = members.value.some(
    (member) => !member.studentId.trim() && !member.name.trim(),
  );
  if (!hasCompletedMember || hasEmptyMember) return;
  members.value.push(createEmptyMember());
}

function removeMember(id: number) {
  members.value = members.value.filter((member) => member.id !== id);
  if (members.value.length === 0) {
    members.value = [createEmptyMember()];
    return;
  }
  ensureTrailingEmptyMember();
}

function toggleMemberSelected(id: number) {
  members.value = members.value.map((member) => {
    if (member.id !== id) return member;
    return { ...member, selected: !member.selected };
  });
}

function clearSelectedMembers() {
  members.value = members.value.map((member) => ({ ...member, selected: false }));
}

function toggleSelectionMode() {
  if (isSelectionMode.value) {
    isSelectionMode.value = false;
    clearSelectedMembers();
    return;
  }
  isSelectionMode.value = true;
}

function handleMemberCardClick(id: number) {
  if (!isSelectionMode.value) return;
  toggleMemberSelected(id);
}

function removeSelectedMembers() {
  const selectedIds = new Set(selectedMemberIds.value);
  if (selectedIds.size === 0) return;

  const remaining = members.value.filter((member) => !selectedIds.has(member.id));
  if (remaining.length === 0) {
    members.value = [createEmptyMember()];
    isSelectionMode.value = false;
    return;
  }

  members.value = remaining;
  clearSelectedMembers();
  ensureTrailingEmptyMember();
}

function validateForm() {
  updateFieldErrors();
  if (!bandName.value.trim()) {
    return "밴드명을 입력해 주세요.";
  }
  if (bandNameError.value) {
    return bandNameError.value;
  }
  if (!password.value.trim() || !confirmPassword.value.trim()) {
    return "비밀번호와 비밀번호 재확인을 입력해 주세요.";
  }
  if (passwordMismatchError.value) {
    return passwordMismatchError.value;
  }
  if (completedMemberCount.value < 1) {
    return "최소 1명 이상의 멤버 정보를 입력해 주세요.";
  }
  return "";
}

function handleCreateBand() {
  errorMessage.value = "";
  successMessage.value = "";

  const validationError = validateForm();
  if (validationError) {
    errorMessage.value = validationError;
    return;
  }

  const payload = {
    bandName: bandName.value.trim(),
    members: members.value
      .filter((member) => isMemberFilled(member))
      .map((member) => ({
        studentId: member.studentId.trim(),
        name: member.name.trim(),
      })),
  };

  console.log("밴드 생성 payload:", payload);
  successMessage.value = "밴드 생성이 완료되었습니다. (현재는 더미 동작)";
}

useHead({
  title: "BandPick 밴드 생성",
});
</script>
