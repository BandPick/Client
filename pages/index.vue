<template>
  <div class="mx-auto max-w-6xl px-4 py-12">
    <section class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
      <p class="text-sm font-semibold text-blue-600">밴드 동아리 공연 매칭</p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
        BandPick
      </h1>
      <p class="mt-4 max-w-2xl text-slate-600">
        희망 곡·포지션·합주 가능 시간을 입력하고, 기획자는 팀 매칭과 스케줄을 관리
      </p>

      <div class="mt-10 flex flex-wrap gap-4">
        <NuxtLink
          to="/member"
          class="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
        >
          부원
        </NuxtLink>
        <NuxtLink
          to="/admin"
          class="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
        >
          기획자
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: "BandPick",
});
</script>
