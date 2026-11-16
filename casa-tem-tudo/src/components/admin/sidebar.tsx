"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { ExternalLink, KeyRound, LayoutDashboard, LogOut, Menu, MessageSquareQuote, Package, Settings, Tags, Users, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { api } from "./api-client";

const LINKS = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/avaliacoes", label: "Avaliações", icon: MessageSquareQuote },
  { href: "/admin/configuracoes", label: "Configurações do site", icon: Settings, adminOnly: true },
  { href: "/admin/usuarios", label: "Usuários", icon: Users, adminOnly: true },
  { href: "/admin/conta", label: "Minha conta", icon: KeyRound },
];

export function AdminShell({ user, children }: { user: { name: string; role: "admin" | "editor" }; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/admin/login");
    router.refresh();
  }

  const nav = (
    <nav aria-label="Menu do painel" className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link href="/admin"><Logo tone="light" compact /></Link>
      </div>
      <ul className="mt-4 flex-1 space-y-1 px-3">
        {LINKS.filter((l) => !l.adminOnly || user.role === "admin").map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              aria-current={active(l.href) ? "page" : undefined}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active(l.href) ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
              )}
            >
              <l.icon className={clsx("h-5 w-5", active(l.href) && "text-brand-400")} aria-hidden="true" />
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="space-y-1 border-t border-white/10 p-3">
        <a href="/" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white">
          <ExternalLink className="h-5 w-5" aria-hidden="true" /> Ver site
        </a>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white">
          <LogOut className="h-5 w-5" aria-hidden="true" /> Sair
        </button>
        <div className="mt-2 rounded-xl bg-white/5 px-3 py-3">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          <p className="text-xs text-white/50">{user.role === "admin" ? "Administrador" : "Editor"}</p>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-graphite-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-navy-950 lg:block">{nav}</aside>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-graphite-200 bg-white px-4 lg:hidden">
        <Link href="/admin"><Logo compact /></Link>
        <button onClick={() => setOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-graphite-100" aria-label="Abrir menu">
          <Menu className="h-6 w-6" />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 animate-fade-up bg-navy-950">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl text-white/70 hover:bg-white/10" aria-label="Fechar menu">
              <X className="h-5 w-5" />
            </button>
            {nav}
          </aside>
        </div>
      )}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}

export function PageTitle({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-graphite-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}
