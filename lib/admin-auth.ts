import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";
import AdminSession from "@/lib/models/AdminSession";

const ADMIN_COOKIE_NAME = "admin-token";
const ADMIN_SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export async function getAdminFromRequest(): Promise<{ id: string; email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  await connectDB();
  const session = await AdminSession.findOne({
    token,
    expiresAt: { $gt: new Date() },
  }).lean();
  if (!session) return null;
  const doc = session as { adminId: { toString: () => string } };
  const admin = await Admin.findById(doc.adminId).select("email").lean();
  if (!admin) return null;
  const a = admin as { _id: { toString: () => string }; email: string };
  return { id: a._id.toString(), email: a.email };
}

export async function createAdminSession(adminId: string): Promise<string> {
  await connectDB();
  const crypto = await import("crypto");
  const token = crypto.randomBytes(32).toString("hex");
  await AdminSession.create({
    token,
    adminId,
    expiresAt: new Date(Date.now() + ADMIN_SESSION_MAX_AGE_MS),
  });
  return token;
}

export function getAdminCookieOpts() {
  return {
    name: ADMIN_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 dias em segundos
  };
}

export async function destroyAdminSession(token: string): Promise<void> {
  await connectDB();
  await AdminSession.deleteOne({ token });
}
