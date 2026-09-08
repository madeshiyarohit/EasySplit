"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { signInWithPopup } from "firebase/auth";
import { AlertCircle, ArrowLeft, ArrowRight, Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { firebaseAuth, googleProvider } from "@/lib/firebase";
import { clearGoogleUser, saveGoogleUser } from "@/lib/google-user";

/* ─── Google icon ──────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

/* ─── Confetti ─────────────────────────────────────────────────── */
const CONFETTI_COLORS = ["#22c55e", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6", "#ef4444"];

function ConfettiEffect() {
  const particles = Array.from({ length: 56 }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    size: 5 + Math.random() * 5,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    duration: 1.8 + Math.random() * 1.2,
    delay: Math.random() * 0.6,
    rotate: Math.random() * 360,
    drift: (Math.random() - 0.5) * 60,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{ left: `${p.x}%`, top: 0, width: p.size, height: p.size, backgroundColor: p.color }}
          initial={{ y: -12, rotate: p.rotate, opacity: 1 }}
          animate={{ y: 380, x: p.drift, rotate: p.rotate + 540, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

/* ─── Orbiting boxes animation ─────────────────────────────────── */
function VerifyingSpinner({ digits }: { digits: string[] }) {
  const shown = digits.filter(Boolean).slice(0, 4);
  while (shown.length < 4) shown.push("•");

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <div className="relative h-28 w-28">
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        >
          {[
            { top: 0,    left: 0 },
            { top: 0,    right: 0 },
            { bottom: 0, left: 0 },
            { bottom: 0, right: 0 },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute flex h-11 w-11 items-center justify-center rounded-xl border-2 text-base font-bold tabular-nums"
              style={{
                ...pos,
                borderColor: "hsl(var(--accent) / 0.7)",
                backgroundColor: "hsl(var(--accent) / 0.08)",
                borderStyle: "dashed",
                color: "hsl(var(--accent))",
              }}
            >
              {shown[i]}
            </div>
          ))}
        </motion.div>
      </div>
      <p className="text-sm text-muted-foreground">Verifying your code…</p>
    </div>
  );
}

/* ─── Success screen ────────────────────────────────────────────── */
function SuccessScreen({ name, photoURL }: { name?: string | null; photoURL?: string | null }) {
  return (
    <div className="relative flex flex-col items-center gap-4 py-6 text-center">
      <ConfettiEffect />

      {/* Google profile photo OR animated checkmark */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.05 }}
        className="relative"
      >
        {[0, 1].map((ring) => (
          <motion.span
            key={ring}
            className="absolute inset-0 rounded-2xl border-2 border-positive/40"
            animate={{ scale: [1, 1.9], opacity: [0.7, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: ring * 0.5, ease: "easeOut" }}
          />
        ))}
        {photoURL ? (
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl ring-4 ring-positive/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoURL} alt={name ?? "User"} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            <div className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-positive">
              <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-positive shadow-lg shadow-positive/30">
            <motion.svg viewBox="0 0 24 24" fill="none" className="h-8 w-8">
              <motion.path
                d="M5 13l4 4L19 7"
                stroke="white"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
              />
            </motion.svg>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-xl font-bold text-positive">
          {name ? `Welcome, ${name.split(" ")[0]}!` : "Verified Successfully"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {name ? "Signed in with Google." : "Your number has been verified."}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.45 }}
        className="flex items-center gap-1.5 rounded-full border border-positive/30 bg-positive/10 px-4 py-1.5 text-xs font-semibold text-positive"
      >
        <Lock className="h-3 w-3" />
        Verified and Secure
      </motion.div>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────── */
export function OtpLogin() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState<"phone" | "otp" | "verifying" | "success">("phone");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [googleName, setGoogleName] = useState<string | null>(null);
  const [googlePhoto, setGooglePhoto] = useState<string | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const resendTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-focus handled via onAnimationComplete on the OTP motion.div (see below)

  function startResendTimer() {
    setResendCountdown(30);
    resendTimer.current = setInterval(() => {
      setResendCountdown((n) => {
        if (n <= 1) { clearInterval(resendTimer.current!); return 0; }
        return n - 1;
      });
    }, 1000);
  }

  async function triggerVerify(digits: string[]) {
    setStage("verifying");
    setError(null);

    await new Promise((r) => setTimeout(r, 900));

    const { error } = await supabase.auth.verifyOtp({
      phone: `+91${phone}`,
      token: digits.join(""),
      type: "sms",
    });

    if (error) {
      setError(error.message);
      setOtp(Array(6).fill(""));
      setStage("otp");
      return;
    }

    // Phone login — clear any stale Google user so TopNav shows correct info
    clearGoogleUser();
    setGoogleName(null);
    setGooglePhoto(null);
    setStage("success");
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 2600);
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
    if (value && index === 5 && next.every((d) => d)) triggerVerify(next);
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  async function handleSendCode() {
    if (phone.length !== 10) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` });

    setLoading(false);
    if (error) { setError(error.message); return; }

    setStage("otp");
    startResendTimer();
  }

  async function handleResend() {
    if (resendCountdown > 0) return;
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` });
    if (error) { setError(error.message); return; }
    startResendTimer();
  }

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const user = result.user;
      const name = user.displayName ?? "User";
      const email = user.email ?? "";
      const photo = user.photoURL;

      // Persist profile so TopNav can read it immediately
      saveGoogleUser({ name, email, photoURL: photo });
      setGoogleName(name);
      setGooglePhoto(photo);

      // Set a cookie so proxy.ts recognises this as an authenticated session
      document.cookie = "gauth=1; path=/; max-age=2592000; SameSite=Lax";

      // Show same orbiting → confetti animation
      setStage("verifying");
      await new Promise((r) => setTimeout(r, 950));
      setStage("success");
      setTimeout(() => { router.push("/dashboard"); router.refresh(); }, 2600);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // User dismissed — do nothing
      } else if (code === "auth/popup-blocked") {
        setError("Popup was blocked by your browser. Please allow popups for this site.");
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">

        {/* Brand */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-3xl text-accent-foreground shadow-lg shadow-accent/20">
            ₹
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">SplitEasy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Split expenses. Settle smarter.</p>
        </div>

        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm">
          <AnimatePresence mode="wait">

            {/* ── Phone stage ── */}
            {stage === "phone" && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-base font-semibold">Enter your phone</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    We&apos;ll send a one-time code via SMS.
                  </p>
                </div>

                <div className="flex h-11 items-center gap-2 rounded-xl border border-input bg-surface px-4 transition-shadow focus-within:ring-2 focus-within:ring-ring">
                  <span className="shrink-0 text-sm font-medium text-muted-foreground">+91</span>
                  <div className="h-4 w-px shrink-0 bg-border" />
                  <input
                    autoFocus
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setError(null); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                    className="flex-1 bg-transparent text-sm outline-none tabular-nums"
                  />
                  {phone.length > 0 && (
                    <span className="shrink-0 text-xs text-muted-foreground">{phone.length}/10</span>
                  )}
                </div>

                {error && <ErrorBanner message={error} />}

                <Button
                  size="lg"
                  variant="accent"
                  className="w-full"
                  disabled={phone.length !== 10 || loading}
                  onClick={handleSendCode}
                >
                  {loading ? "Sending…" : "Send code"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Google sign-in */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface text-sm font-medium text-foreground transition-colors hover:bg-muted active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <motion.div
                      className="h-4 w-4 rounded-full border-2 border-border border-t-foreground"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <GoogleIcon />
                  )}
                  Continue with Google
                </button>
              </motion.div>
            )}

            {/* ── OTP entry stage ── */}
            {stage === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onAnimationComplete={() => inputsRef.current[0]?.focus()}
                className="space-y-5"
              >
                <div>
                  <button
                    onClick={() => {
                      setStage("phone");
                      setOtp(Array(6).fill(""));
                      setError(null);
                      if (resendTimer.current) clearInterval(resendTimer.current);
                    }}
                    className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Change number
                  </button>
                  <h2 className="text-base font-semibold">Enter the code</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Sent to <span className="font-medium text-foreground">+91 {phone}</span>
                  </p>
                </div>

                {/* OTP boxes with glow */}
                <div className="flex gap-2">
                  {otp.map((digit, i) => (
                    <div key={i} className="relative flex-1">
                      <input
                        ref={(el) => { inputsRef.current[i] = el; }}
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => { handleOtpChange(i, e.target.value); setError(null); }}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onFocus={() => setFocusedIndex(i)}
                        onBlur={() => setFocusedIndex(null)}
                        className="h-12 w-full rounded-xl border-2 bg-muted/40 text-center text-xl font-bold tabular-nums outline-none transition-all duration-150"
                        style={{
                          borderColor:
                            focusedIndex === i
                              ? "hsl(var(--accent))"
                              : digit
                              ? "hsl(var(--accent) / 0.45)"
                              : "hsl(var(--border))",
                          boxShadow:
                            focusedIndex === i
                              ? "0 0 0 3px hsl(var(--accent) / 0.2), 0 0 14px 2px hsl(var(--accent) / 0.25)"
                              : "none",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {error && <ErrorBanner message={error} />}

                <button
                  onClick={handleResend}
                  disabled={resendCountdown > 0}
                  className="flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground disabled:opacity-50 enabled:hover:text-foreground"
                >
                  <Shield className="h-3.5 w-3.5" />
                  {resendCountdown > 0
                    ? `Resend code in ${resendCountdown}s`
                    : "Didn't receive the code? Resend"}
                </button>
              </motion.div>
            )}

            {/* ── Verifying stage ── */}
            {stage === "verifying" && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <VerifyingSpinner digits={otp} />
              </motion.div>
            )}

            {/* ── Success stage ── */}
            {stage === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <SuccessScreen name={googleName} photoURL={googlePhoto} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {stage === "phone" && (
          <p className="text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <button className="underline-offset-2 hover:underline">Terms</button> and{" "}
            <button className="underline-offset-2 hover:underline">Privacy Policy</button>
          </p>
        )}
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
