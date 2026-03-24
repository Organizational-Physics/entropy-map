import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { checkCoachRateLimit } from "@/lib/rate-limit";
import { coachPip } from "@/lib/classifier";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request.headers.get("authorization"));
  if (!auth.valid) {
    return Response.json({ error: auth.error }, { status: 401 });
  }

  const rl = checkCoachRateLimit(auth.keyId!);
  if (!rl.allowed) {
    return Response.json({ aligned: true, tip: null }, { status: 200 });
  }

  const { pip_text } = await request.json();
  if (!pip_text?.trim()) {
    return Response.json({ aligned: false, tip: "Describe the specific friction you experienced." });
  }

  const tip = await coachPip(pip_text.trim());
  return Response.json({ aligned: tip === null, tip });
}
