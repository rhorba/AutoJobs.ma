"use client";

import posthog from "posthog-js";
import { useEffect, useState } from "react";

const PH_KEY  = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const PH_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com";
const CONSENT_KEY = "cookie_consent";

export function useConsent() {
  const [consent, setConsent] = useState<boolean | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(CONSENT_KEY);
    return stored !== null ? stored === "true" : null;
  });

  function accept() {
    localStorage.setItem(CONSENT_KEY, "true");
    setConsent(true);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "false");
    setConsent(false);
  }

  return { consent, accept, decline };
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (localStorage.getItem(CONSENT_KEY) === "true" && PH_KEY) {
      posthog.init(PH_KEY, {
        api_host: PH_HOST,
        person_profiles: "identified_only",
        ip: false, // IP anonymization for Loi 09-08
        capture_pageview: true,
        loaded: (ph) => {
          if (process.env.NODE_ENV === "development") ph.opt_out_capturing();
        },
      });
    }
  }, []);

  return <>{children}</>;
}
