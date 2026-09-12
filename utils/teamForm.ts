export const TEAM_POSITIONS = ["V", "D", "B", "EG1", "EG2", "AG", "K"] as const;
export const PROFICIENCY_LEVELS = ["상", "중", "하"] as const;

export type TeamPosition = (typeof TEAM_POSITIONS)[number];
export type ProficiencyLevel = (typeof PROFICIENCY_LEVELS)[number];
export type TeamSkills = Record<TeamPosition, ProficiencyLevel | "">;
export type TeamPriorities = Record<TeamPosition, number | null>;

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

export function createEmptyTeamPriorities(): TeamPriorities {
  return {
    V: null,
    D: null,
    B: null,
    EG1: null,
    EG2: null,
    AG: null,
    K: null,
  };
}