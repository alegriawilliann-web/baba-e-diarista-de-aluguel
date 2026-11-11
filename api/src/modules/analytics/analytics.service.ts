import { db } from "../../config/database";
import { downloadLinkClicks } from "./analytics.model";

function detectarOs(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "outro";
}

export async function registrarCliqueDownload(userAgent: string | null) {
  const os = detectarOs(userAgent ?? "");
  await db.insert(downloadLinkClicks).values({ os, userAgent });
}

export async function resumoCliquesDownload() {
  const linhas = await db.query.downloadLinkClicks.findMany();
  const porOs: Record<string, number> = {};
  for (const linha of linhas) porOs[linha.os] = (porOs[linha.os] ?? 0) + 1;
  return { total: linhas.length, porOs };
}
