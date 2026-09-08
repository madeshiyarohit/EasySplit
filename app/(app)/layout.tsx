import { TopNav } from "@/components/layout/top-nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ToastProvider } from "@/lib/toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-full flex-col">
        <TopNav />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-24 sm:px-6 sm:py-10 sm:pb-10">
          <Breadcrumbs />
          {children}
        </main>
        <BottomNav />
      </div>
    </ToastProvider>
  );
}
