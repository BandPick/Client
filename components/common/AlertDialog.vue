<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-[2px]"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.self="close"
      >
        <div
          class="relative w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl"
          :style="{ borderTop: `4px solid ${accentColor}` }"
        >
          <button
            type="button"
            class="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-sm text-slate-500 hover:bg-slate-200"
            aria-label="닫기"
            @click="close"
          >
            ✕
          </button>

          <div class="mb-4 flex items-center gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              :class="iconWrapClass"
            >
              <svg
                v-if="type === 'success'"
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                aria-hidden="true"
              >
                <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg
                v-else
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5" stroke-linecap="round" />
                <circle cx="12" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <h2 :id="titleId" class="text-lg font-bold text-slate-900">
              {{ resolvedTitle }}
            </h2>
          </div>

          <p class="text-sm leading-6 text-slate-600">
            {{ message }}
          </p>

          <button
            type="button"
            class="mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition"
            :class="type === 'success' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'"
            @click="confirm"
          >
            {{ actionLabel }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
type AlertType = "success" | "error";

const props = withDefaults(
  defineProps<{
    open: boolean;
    message: string;
    type?: AlertType;
    title?: string;
    actionLabel?: string;
  }>(),
  {
    type: "error",
    title: "",
    actionLabel: "확인",
  },
);

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();

const titleId = useId();

const accentColor = computed(() =>
  props.type === "success" ? "#2563eb" : "#e11d48",
);

const iconWrapClass = computed(() =>
  props.type === "success"
    ? "bg-blue-50 text-blue-600"
    : "bg-rose-50 text-rose-600",
);

const resolvedTitle = computed(() => {
  if (props.title) return props.title;
  return props.type === "success" ? "완료" : "알림";
});

function close() {
  emit("close");
}

function confirm() {
  emit("confirm");
}

function onEscape(event: KeyboardEvent) {
  if (event.key === "Escape" && props.open) {
    close();
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (!import.meta.client) return;
    if (isOpen) {
      window.addEventListener("keydown", onEscape);
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
