import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { useAuth } from "@/lib/auth";
import { loadProfile, saveProfile } from "@/lib/rewards-profile";
import type { RewardsProfile } from "@/lib/rewards-engine";
import { toast } from "sonner";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Find savings · Reward Wiz" },
      {
        name: "description",
        content:
          "Build your rewards profile — subscriptions, cards, carrier plan — and scan for duplicate bills and forgotten perks.",
      },
    ],
  }),
  component: Scan,
});

function Scan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [initial, setInitial] = useState<RewardsProfile | undefined>();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadProfile(user?.id ?? null).then((profile) => {
      setInitial(profile);
      setLoaded(true);
    });
  }, [user?.id]);

  const handleComplete = async (profile: RewardsProfile) => {
    try {
      await saveProfile(user?.id ?? null, profile);
    } catch {
      toast.error("Could not save profile", {
        description: "The scan will still run — sign in to keep results.",
      });
    }
    toast.success("Profile saved", { description: "Running your scan…" });
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Find the money you're leaving on the table.
          </h1>
          <p className="mt-2 text-muted-foreground">
            Three quick steps. We'll check for duplicate bills, carrier perks,
            and card benefits you forgot you had.
          </p>
        </div>
        {loaded && <OnboardingWizard initial={initial} onComplete={handleComplete} />}
      </main>
    </div>
  );
}
