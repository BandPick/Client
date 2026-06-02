export interface SettingsRequest {
  /** ISO 8601, 예: "2026-04-10T23:59:59" */
  deadline: string;
  minVocalSongs: number;
  minSessionSongs: number;
}

export interface SettingsResponse extends SettingsRequest {
  id: number;
  updateTime: string;
}
