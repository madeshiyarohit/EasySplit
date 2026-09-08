"use client";

import Link from "next/link";
import { useState } from "react";
import { AtSign, CheckCircle2, Code2, Mail, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/lib/toast";

const CONTACT_LINKS = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@spliteasy.in",
    href: "mailto:hello@spliteasy.in",
    description: "For feature requests and bug reports",
  },
  {
    icon: Code2,
    label: "GitHub",
    value: "github.com/rohitmadeshiya",
    href: "https://github.com",
    description: "Open an issue or browse the source",
  },
  {
    icon: AtSign,
    label: "Twitter / X",
    value: "@rohitmadeshiya",
    href: "https://twitter.com",
    description: "Quick questions and updates",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+91 98765 43210",
    href: "https://wa.me/919876543210",
    description: "For urgent support",
  },
];

export default function ContactPage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    // In a real app this would POST to an API
    setSent(true);
    toast("Message sent — we'll get back to you soon!");
    setName(""); setEmail(""); setMessage("");
    setTimeout(() => setSent(false), 5000);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">Contact us</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Have a question, found a bug, or want to suggest a feature? We&apos;d love to hear from you.
        </p>
      </section>

      {/* Contact methods */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Get in touch</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CONTACT_LINKS.map(({ icon: Icon, label, value, href, description }) => (
            <Link
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group"
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className="mt-0.5 truncate text-sm font-medium text-accent">{value}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Message form */}
      <Card>
        <CardHeader>
          <CardTitle>Send a message</CardTitle>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-positive" />
              <p className="text-sm font-medium">Message received!</p>
              <p className="text-xs text-muted-foreground">
                We typically reply within 24–48 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="contact-name">Your name</Label>
                  <Input
                    id="contact-name"
                    placeholder="Priya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-email">Email address</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="priya@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-message">Message</Label>
                <textarea
                  id="contact-message"
                  rows={5}
                  placeholder="Tell us what's on your mind..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full resize-none rounded-xl border border-input bg-surface px-4 py-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button
                type="submit"
                variant="accent"
                size="sm"
                disabled={!name.trim() || !email.trim() || !message.trim()}
              >
                Send message
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Want to learn more about SplitEasy first?{" "}
        <Link href="/about" className="text-accent hover:underline">
          Read about us →
        </Link>
      </p>
    </div>
  );
}
