<template>
  <div class="min-h-screen bg-slate-100 text-slate-900">
    <header class="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 md:hidden"
            aria-label="메뉴 열기"
            @click="mobileNavOpen = true"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <NuxtLink to="/" class="text-sm font-medium text-slate-500 hover:text-slate-800">
            ← 홈
          </NuxtLink>
          <span class="hidden text-slate-300 sm:inline">|</span>
          <h1 class="text-lg font-bold text-indigo-700">기획자</h1>
        </div>
      </div>
    </header>

    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="mobileNavOpen"
          class="fixed inset-0 z-50 bg-slate-900/40 md:hidden"
          aria-hidden="true"
          @click="mobileNavOpen = false"
        />
      </Transition>

      <Transition
        enter-active-class="transition-transform duration-200 ease-out"
        enter-from-class="-translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-150 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="-translate-x-full"
      >
        <aside
          v-if="mobileNavOpen"
          class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white shadow-xl md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="기획자 메뉴"
        >
          <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <span class="text-sm font-bold text-indigo-700">메뉴</span>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label="메뉴 닫기"
              @click="mobileNavOpen = false"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-3">
            <AdminSidebarNav @navigate="mobileNavOpen = false" />
          </div>
        </aside>
      </Transition>
    </Teleport>

    <div class="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <aside class="hidden w-52 shrink-0 rounded-xl border border-slate-200 bg-white p-3 md:block">
        <AdminSidebarNav />
      </aside>

      <div class="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const mobileNavOpen = ref(false);

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    mobileNavOpen.value = false;
  }
}

watch(
  () => route.path,
  () => {
    mobileNavOpen.value = false;
  },
);

watch(mobileNavOpen, (open) => {
  if (!import.meta.client) return;

  if (open) {
    document.addEventListener("keydown", onKeydown);
    document.body.style.overflow = "hidden";
    return;
  }

  document.removeEventListener("keydown", onKeydown);
  document.body.style.overflow = "";
});

onUnmounted(() => {
  if (!import.meta.client) return;

  document.removeEventListener("keydown", onKeydown);
  document.body.style.overflow = "";
});
</script>
