import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { CREDIT_CLIENT_SESSION_COOKIE, CREDIT_CLIENT_SESSION_TTL_HOURS } from "@/lib/credit/constants";
import { randomToken } from "@/lib/credit/helpers";
import { hashPassword, sha256, verifyPassword } from "@/lib/admin-interno/security";

function sessionExpiryDate() {
  return new Date(Date.now() + CREDIT_CLIENT_SESSION_TTL_HOURS * 60 * 60 * 1000);
}

export async function createCreditCustomer(params: {
  name: string;
  email: string;
  phone: string;
  password: string;
}) {
  const passwordHash = await hashPassword(params.password);
  return prisma.creditCustomerUser.create({
    data: {
      name: params.name,
      email: params.email.toLowerCase().trim(),
      phone: params.phone,
      passwordHash,
    },
  });
}

export async function authenticateCreditCustomer(email: string, password: string) {
  const user = await prisma.creditCustomerUser.findUnique({
    where: {
      email: email.toLowerCase().trim(),
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return user;
}

export async function createCreditClientSession(params: {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const token = randomToken(64);
  const expiresAt = sessionExpiryDate();

  await prisma.creditClientSession.create({
    data: {
      tokenHash: sha256(token),
      userId: params.userId,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function persistCreditClientSessionCookie(token: string, expiresAt: Date) {
  const secure = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();
  cookieStore.set({
    name: CREDIT_CLIENT_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    expires: expiresAt,
  });
}

export async function clearCreditClientSessionCookie() {
  const secure = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();
  cookieStore.set({
    name: CREDIT_CLIENT_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    expires: new Date(0),
  });
}

export async function getCreditClientSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CREDIT_CLIENT_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const session = await prisma.creditClientSession.findUnique({
    where: {
      tokenHash: sha256(token),
    },
    include: {
      user: true,
    },
  });

  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now() || !session.user.isActive) {
    return null;
  }

  return session;
}

export async function requireCreditClientSession() {
  const session = await getCreditClientSession();
  if (!session) {
    redirect("/cliente/login");
  }
  return session;
}

export async function revokeCreditSession(token: string | null | undefined) {
  if (!token) {
    return;
  }
  await prisma.creditClientSession.updateMany({
    where: {
      tokenHash: sha256(token),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
