import type { NextRequest } from "next/server";
import { assertSameOrigin, handler, json } from "@/lib/api";
import { endSession } from "@/lib/auth";

export const POST = handler(async (req: NextRequest) => {
  assertSameOrigin(req);
  await endSession();
  return json({ ok: true });
});
