import { defineStore } from "pinia";

export const useSettingsStore = defineStore("settings", {
 state: () => ({
  minVocal: 6,
  minSession: 6,
  deadline: "",
 }),

 actions: {
  setMinCounts(vocal: number, session: number) {
   this.minVocal = vocal;
   this.minSession = session;

   this.persist();
  },

  setDeadline(deadline: string) {
   this.deadline = deadline;
   this.persist();
  },

  /** 서버에서 받은 값을 한 번에 반영 (로컬 저장 포함) */
  applyFromApi(minVocal: number, minSession: number, deadline: string) {
   this.minVocal = minVocal;
   this.minSession = minSession;
   this.deadline = deadline;
   this.persist();
  },

  persist() {
   if (!import.meta.client) return;

   localStorage.setItem(
    "settings",
    JSON.stringify({
     minVocal: this.minVocal,
     minSession: this.minSession,
     deadline: this.deadline,
    })
   );
  },

  hydrate() {
   if (!import.meta.client) return;

   const data = localStorage.getItem("settings");
   if (!data) return;

   try {
    const parsed = JSON.parse(data);
    this.minVocal = parsed.minVocal ?? 6;
    this.minSession = parsed.minSession ?? 6;
    this.deadline = parsed.deadline ?? "";
   } catch {
    // ignore
   }
  },
 },
});