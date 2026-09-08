<template>
  <div class="overflow-x-auto rounded-xl border border-slate-200">
    <table class="min-w-[920px] w-full table-fixed divide-y divide-slate-200 text-center text-sm">
      <colgroup>
        <col class="w-20" />
        <col span="5" class="w-32" />
        <col class="w-36" />
      </colgroup>
      <thead class="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
        <tr>
          <th
            v-for="(col, ci) in columns"
            :key="col"
            class="whitespace-nowrap border-r border-slate-200 px-2 py-3 last:border-r-0"
            :class="ci === 0 ? 'sticky left-0 z-10 bg-slate-50' : ''"
          >
            {{ col }}
          </th>
        </tr>
      </thead>

      <tbody class="divide-y divide-slate-100 bg-white">
        <!-- 데이터가 없는 경우 -->
        <tr v-if="!rows.length">
          <td
            :colspan="columns.length"
            class="px-4 py-8 text-center text-slate-500"
          >
            {{ emptyText }}
          </td>
        </tr>

        <!-- 데이터가 존재하는 경우 -->
        <tr v-for="(row, ri) in rows" :key="ri">
          <td
            v-for="(cell, ci) in row"
            :key="ci"
            class="whitespace-nowrap border-r border-slate-100 px-5 py-3 text-slate-800 last:border-r-0"
            :class="ci === 0 ? 'sticky left-0 z-[1] bg-white' : ''"
          >
            {{ cell }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    columns: string[];
    rows: string[][];
    emptyText?: string;
  }>(),
  {
    emptyText: "데이터가 없습니다.",
  },
);
</script>
