export type SessionCode = "V" | "D" | "K1" | "K2" | "EG1" | "EG2" | "AG" | "B" | "기타";

export type SongCatalogItem = {
  id: string;
  title: string;
  requiredSessions: SessionCode[];
};

export const sessionCodes: SessionCode[] = ["V", "D", "K1", "K2", "EG1", "EG2", "AG", "B", "기타"];

export const songCatalog: SongCatalogItem[] = [
  {
    id: "hype-boy",
    title: "Hype Boy - NewJeans",
    requiredSessions: ["V", "K1", "K2", "EG1", "B", "D"],
  },
  {
    id: "ditto",
    title: "Ditto - NewJeans",
    requiredSessions: ["V", "EG1", "EG2", "B", "D", "기타"],
  },
  {
    id: "supernova",
    title: "Supernova - aespa",
    requiredSessions: ["V", "K1", "K2", "EG1", "B", "D"],
  },
  {
    id: "every-moment",
    title: "너의 모든 순간 - 성시경",
    requiredSessions: ["V", "AG", "K1", "B", "D", "기타"],
  },
  {
    id: "time-walk",
    title: "시간을 걷는 소년 - 넬",
    requiredSessions: ["V", "EG1", "EG2", "AG", "B", "D"],
  },
];
