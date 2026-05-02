import { InternalAdminShell } from "@/components/admin-interno/shell";
import { requireInternalPageSession } from "@/lib/admin-interno/auth";
import { INTERNAL_ROLE_LABEL } from "@/lib/admin-interno/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InternalPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireInternalPageSession("dashboard:view");

  return (
    <InternalAdminShell
      user={{
        fullName: session.fullName,
        email: session.email,
        role: INTERNAL_ROLE_LABEL[session.role],
      }}
    >
      {children}
    </InternalAdminShell>
  );
}
