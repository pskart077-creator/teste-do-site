import { AdminCreditRulesForm } from "@/components/credito/AdminCreditRulesForm";
import { getOrCreateCreditRules } from "@/lib/credit/rules";

export default async function AdminCreditoRegrasPage() {
  const rules = await getOrCreateCreditRules();
  return <AdminCreditRulesForm initialRules={rules} />;
}
