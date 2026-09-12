export const TEAM_POSITIONS = ["V", "D", "B", "EG1", "EG2", "AG", "K"] as const;
export const PROFICIENCY_LEVELS = ["상", "중", "하"] as const;

export type TeamPosition = (typeof TEAM_POSITIONS)[number];
export type ProficiencyLevel = (typeof PROFICIENCY_LEVELS)[number];
export type TeamSkills = Record<TeamPosition, ProficiencyLevel | "">;

export function createEmptyTeamSkills(): TeamSkills {
  return {
    V: "",
    D: "",
    B: "",
    EG1: "",
    EG2: "",
    AG: "",
    K: "",
  };
}
