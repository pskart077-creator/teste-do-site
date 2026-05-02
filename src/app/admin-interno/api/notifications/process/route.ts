import type { NextRequest } from "next/server";
import { fromUnknownError, ok } from "@/lib/admin-interno/api";
import { requireInternalApiSession } from "@/lib/admin-interno/auth";
import { processPendingNotificationJobs } from "@/lib/admin-interno/notifications";

export async function POST(request: NextRequest) {
  try {
    const processToken = process.env.INTERNAL_NOTIFICATION_PROCESS_TOKEN;
    if (processToken) {
      const headerToken = request.headers.get("x-internal-process-token");
      if (headerToken !== processToken) {
        await requireInternalApiSession(request, {
          permission: "settings:manage",
          requireCsrf: true,
        });
      }
    } else {
      await requireInternalApiSession(request, {
        permission: "settings:manage",
        requireCsrf: true,
      });
    }

    const result = await processPendingNotificationJobs();

    return ok(result);
  } catch (error) {
    return fromUnknownError(error);
  }
}
