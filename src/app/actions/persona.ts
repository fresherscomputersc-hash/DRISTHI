"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { PERSONAS } from "@/components/shell/nav-config";

const VALID = new Set(PERSONAS.map((p) => p.id));

export async function setPersona(persona: string) {
  const next = VALID.has(persona as (typeof PERSONAS)[number]["id"]) ? persona : "exec";
  const jar = await cookies();
  jar.set("drishti_persona", next, {
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
