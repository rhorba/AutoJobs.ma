import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/posthog-provider";
import { CookieConsent } from "@/components/cookie-consent";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: { default: "AutoJobs.ma", template: "%s | AutoJobs.ma" },
  description:
    "Le job board vertical du secteur automobile, batteries et véhicules électriques au Maroc.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <PostHogProvider>
          {children}
          <CookieConsent />
          <Toaster position="bottom-right" richColors />
        </PostHogProvider>
      </body>
    </html>
  );
}
