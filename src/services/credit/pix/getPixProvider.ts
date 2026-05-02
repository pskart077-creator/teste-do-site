import { getPixProviderFromEnv } from "@/lib/credit/constants";
import { mockPixProvider } from "@/services/credit/pix/providers/mockPixProvider";
import { createUnconfiguredProvider } from "@/services/credit/pix/providers/unconfiguredProvider";
import { vexusPayProvider } from "@/services/credit/pix/providers/vexusPayProvider";

export function getPixProvider() {
  const provider = getPixProviderFromEnv();

  if (provider === "VEXUSPAY") {
    return vexusPayProvider;
  }

  if (provider === "MOCK") {
    return mockPixProvider;
  }

  return createUnconfiguredProvider(provider);
}
