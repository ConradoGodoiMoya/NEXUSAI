import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-950 lg:block">
        <div className="blueprint-grid absolute inset-0" aria-hidden="true" />
        <div className="absolute -left-20 top-1/3 h-96 w-96 rounded-full bg-brand-500/25 blur-3xl" aria-hidden="true" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo tone="light" />
          <div>
            <p className="font-display text-4xl font-extrabold leading-tight text-white">Gerencie o site da sua loja,<br />sem precisar de programação.</p>
            <p className="mt-4 max-w-md text-white/60">Produtos, categorias, imagens, avaliações e informações da empresa em um só lugar.</p>
          </div>
          <p className="text-sm text-white/40">Acesso restrito à equipe Casa Tentudo.</p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-graphite-50 px-6 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden"><Logo /></Link>
          <h1 className="mt-10 text-3xl font-extrabold lg:mt-0">Entrar no painel</h1>
          <p className="mt-2 text-graphite-600">Use o e-mail e a senha cadastrados.</p>
          <LoginForm />
          <Link href="/" className="mt-8 inline-block text-sm font-medium text-graphite-500 hover:text-navy-900">← Voltar ao site</Link>
        </div>
      </div>
    </main>
  );
}
