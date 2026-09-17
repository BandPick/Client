import { canvasToJpegBlob, saveImageBlob } from "~/utils/saveImage";

export type MemberTeamCardSlot = {
  position: string;
  needed: boolean;
  userId: number | null;
  name: string | null;
  level: string;
  me: boolean;
};

export type MemberTeamCard = {
  name: string;
  confirmed: boolean;
  myPositions: string[];
  slots: MemberTeamCardSlot[];
};

const SCALE = 2;
const CARD_WIDTH = 360;
const PAGE_PAD = 20;
const CARD_PAD = 18;
const CARD_GAP = 16;
const TITLE_SIZE = 20;
const SUB_SIZE = 13;
const ROW_H = 38;
const ROW_GAP = 8;
const HEADER_H = 58;
const RADIUS = 16;

export async function downloadMemberTeamCards(
  teams: MemberTeamCard[],
  filename: string,
) {
  const canvas = renderMemberTeamCards(teams);
  const blob = await canvasToJpegBlob(canvas);
  await saveImageBlob(blob, filename, "image/jpeg");
}

function renderMemberTeamCards(teams: MemberTeamCard[]): HTMLCanvasElement {
  const widths = CARD_WIDTH;
  const heights = teams.map((team) => cardHeight(team));
  const pageWidth = widths + PAGE_PAD * 2;
  const pageHeight =
    PAGE_PAD * 2
    + heights.reduce((sum, height) => sum + height, 0)
    + CARD_GAP * Math.max(0, teams.length - 1);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(pageWidth * SCALE);
  canvas.height = Math.round(pageHeight * SCALE);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("canvas-unavailable");
  }

  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, pageWidth, pageHeight);

  let y = PAGE_PAD;
  for (let index = 0; index < teams.length; index += 1) {
    drawCard(ctx, PAGE_PAD, y, teams[index]!);
    y += heights[index]! + CARD_GAP;
  }

  return canvas;
}

function cardHeight(team: MemberTeamCard) {
  return HEADER_H + CARD_PAD + team.slots.length * (ROW_H + ROW_GAP) - ROW_GAP + CARD_PAD;
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  team: MemberTeamCard,
) {
  const height = cardHeight(team);
  ctx.save();
  roundRect(ctx, x, y, CARD_WIDTH, height, RADIUS);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = team.confirmed ? "#6ee7b7" : "#e2e8f0";
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.font = `700 ${TITLE_SIZE}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textBaseline = "top";
  ctx.fillText(team.name || "팀", x + CARD_PAD, y + CARD_PAD);

  const mine = team.myPositions.length
    ? `나의 세션  ${team.myPositions.join(" · ")}`
    : "";
  ctx.fillStyle = "#64748b";
  ctx.font = `500 ${SUB_SIZE}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText(mine, x + CARD_PAD, y + CARD_PAD + 26);

  if (team.confirmed) {
    const label = "확정";
    ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
    const padX = 8;
    const textW = ctx.measureText(label).width;
    const bx = x + CARD_WIDTH - CARD_PAD - textW - padX * 2;
    const by = y + CARD_PAD;
    roundRect(ctx, bx, by, textW + padX * 2, 22, 999);
    ctx.fillStyle = "#d1fae5";
    ctx.fill();
    ctx.fillStyle = "#047857";
    ctx.textBaseline = "middle";
    ctx.fillText(label, bx + padX, by + 11);
  }

  let rowY = y + HEADER_H;
  for (const slot of team.slots) {
    drawSlot(ctx, x + CARD_PAD, rowY, CARD_WIDTH - CARD_PAD * 2, slot);
    rowY += ROW_H + ROW_GAP;
  }
  ctx.restore();
}

function drawSlot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  slot: MemberTeamCardSlot,
) {
  const badgeW = 44;
  roundRect(ctx, x, y, badgeW, ROW_H, 8);
  ctx.fillStyle = "#f1f5f9";
  ctx.fill();
  ctx.fillStyle = "#475569";
  ctx.font = "700 12px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(slot.position, x + badgeW / 2, y + ROW_H / 2);
  ctx.textAlign = "left";

  const barX = x + badgeW + 8;
  const barW = width - badgeW - 8;
  roundRect(ctx, barX, y, barW, ROW_H, 8);

  if (slot.name) {
    ctx.fillStyle = slot.me ? "#7dd3fc" : "#e0f2fe";
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.font = "600 14px ui-sans-serif, system-ui, sans-serif";
    const nameX = barX + 12;
    ctx.fillText(slot.name, nameX, y + ROW_H / 2);
    if (slot.me) {
      const label = "나";
      ctx.font = "700 10px ui-sans-serif, system-ui, sans-serif";
      const lw = ctx.measureText(label).width;
      const lx = barX + barW - 12 - lw - 12;
      roundRect(ctx, lx, y + (ROW_H - 18) / 2, lw + 12, 18, 999);
      ctx.fillStyle = "#2563eb";
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(label, lx + (lw + 12) / 2, y + ROW_H / 2);
      ctx.textAlign = "left";
    }
    return;
  }

  if (!slot.needed) {
    ctx.fillStyle = "#f1f5f9";
    ctx.fill();
    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 12px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("필요없음", barX + 12, y + ROW_H / 2);
    return;
  }

  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 12px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("배정 필요", barX + barW / 2, y + ROW_H / 2);
  ctx.textAlign = "left";
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
