import type { NextRequest } from "next/server";
import { handler, json, parseBody, requireApiUser } from "@/lib/api";
import { logActivity } from "@/lib/data/activity";
import { readSettings, writeSettings } from "@/lib/data/settings";
import { revalidateSettings } from "@/lib/revalidate";
import { siteSettingsSchema } from "@/lib/settings-schema";

export const GET = handler(async (req: NextRequest) => {
  await requireApiUser(req);
  return json({ settings: await readSettings() });
});

export const PUT = handler(async (req: NextRequest) => {
  const user = await requireApiUser(req, "admin");
  const settings = await parseBody(req, siteSettingsSchema);
  await writeSettings(settings);
  await logActivity(user.id, "update", "settings", null, "Atualizou as configurações do site");
  revalidateSettings();
  return json({ settings });
});
