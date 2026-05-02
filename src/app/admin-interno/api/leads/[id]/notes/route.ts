import type { NextRequest } from "next/server";
import { fromUnknownError, ok } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { addLeadNote } from "@/lib/admin-interno/leads";
import { leadNoteSchema } from "@/lib/admin-interno/validators";

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const session = await requireInternalApiSession(request, {
      permission: "leads:note",
      requireCsrf: true,
    });

    const { id } = await context.params;
    const body = leadNoteSchema.parse(await request.json());

    const note = await addLeadNote(id, session.userId, body.note);

    return ok({
      note,
    });
  } catch (error) {
    return fromUnknownError(error);
  }
}
