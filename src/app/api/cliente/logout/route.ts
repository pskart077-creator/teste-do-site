import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { CREDIT_CLIENT_SESSION_COOKIE } from "@/lib/credit/constants";
import { revokeCreditSession } from "@/lib/credit/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(CREDIT_CLIENT_SESSION_COOKIE)?.value;
  await revokeCreditSession(token);

  const response = NextResponse.json({
    success: true,
    data: {
      revoked: true,
    },
  });

  response.cookies.set({
    name: CREDIT_CLIENT_SESSION_COOKIE,
    value: "",
    path: "/",
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
