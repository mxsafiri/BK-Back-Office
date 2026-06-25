import { PageHeader, Stepper } from "@fimco/ui";
import { OnboardingForm } from "./OnboardingForm";

export default function OnboardingPage() {
  return (
    <>
      <PageHeader eyebrow="Clients" title="Onboard a client" subtitle="KYC-gated onboarding; review cases route to a second approver." />
      <div className="mb-6 overflow-x-auto">
        <Stepper steps={["Capture", "KYC", "Open account"]} current={1} />
      </div>
      <OnboardingForm />
    </>
  );
}
