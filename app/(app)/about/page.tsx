import Link from "next/link";
import { Code2, Heart, Layers, Shield, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Layers,
    title: "Smart splitting",
    description:
      "Equal, unequal, by percentage, or by shares — SplitEasy handles every scenario so you never have to do the math.",
  },
  {
    icon: Zap,
    title: "Instant copy-to-pay",
    description:
      "Copy UPI IDs, phone numbers, and emails directly from balance cards. One tap to settle up.",
  },
  {
    icon: Shield,
    title: "Private by design",
    description:
      "All your data lives on your device. No cloud sync, no third-party analytics — just you and your groups.",
  },
  {
    icon: Heart,
    title: "Built for India",
    description:
      "Indian number formatting, ₹ currency, UPI / PhonePe / GPay / Paytm support, and crore-lakh-thousand words.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-10">
      {/* Hero */}
      <section className="space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-2xl text-accent-foreground">
          ₹
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">About SplitEasy</h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          SplitEasy is a modern group expense tracker built for the way Indians actually split bills —
          with UPI, multiple payment apps, and the lakh-crore number system baked right in.
          No subscriptions, no clutter, no ads.
        </p>
      </section>

      {/* Mission */}
      <Card>
        <CardHeader>
          <CardTitle>Our mission</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>
            Splitting expenses with friends, flatmates, and family should take seconds — not spreadsheets.
            SplitEasy was built out of frustration with existing tools that were either too complex,
            too US-centric, or required handing over your data to a server.
          </p>
          <p>
            We believe a great expense-splitting app should be fast, opinionated, and feel native on
            every device from a ₹8,000 phone to a MacBook Pro.
          </p>
        </CardContent>
      </Card>

      {/* Features */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">What makes it different</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardContent className="p-5 space-y-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Team */}
      <Card>
        <CardHeader>
          <CardTitle>Built by</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold">
            RM
          </div>
          <div>
            <p className="text-sm font-semibold">Rohit Madeshiya</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Designer &amp; developer · India
            </p>
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
            >
              <Code2 className="h-3.5 w-3.5" />
              github.com/rohitmadeshiya
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Version */}
      <p className="text-center text-xs text-muted-foreground">
        SplitEasy v1.0 · Made with ❤️ in India ·{" "}
        <Link href="/contact" className="text-accent hover:underline">
          Get in touch
        </Link>
      </p>
    </div>
  );
}
