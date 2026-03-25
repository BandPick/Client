import { defineStore } from "pinia";

export const useSettingsStore = defineStore("settings", {
 state: () => ({
  minVocal: 1,
  minSession: 1,
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
    this.minVocal = parsed.minVocal ?? 1;
    this.minSession = parsed.minSession ?? 1;
    this.deadline = parsed.deadline ?? "";
   } catch {
    // ignore
   }
  },
 },
});