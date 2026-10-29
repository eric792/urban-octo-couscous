import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
}

/** Returns the signed-in admin, re-checked against the database. */
export async function getAdminSession(): Promise<AdminUser | null> {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session || session.role !== "ADMIN") return null;
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, fullName: true, role: true },
  });
  if (!user || user.role !== "ADMIN") return null;
  return { id: user.id, email: user.email, fullName: user.fullName };
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  return admin;
}
