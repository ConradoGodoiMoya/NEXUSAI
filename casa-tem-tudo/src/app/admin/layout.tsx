import type { Metadata } from "next";
import { ToastProvider } from "@/components/admin/toast";

export const metadata: Metadata = {
  title: { default: "Painel administrativo", template: "%s · Painel Casa Tentudo" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
