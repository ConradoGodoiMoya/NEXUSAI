import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-graphite-50 px-6 text-center">
      <Link href="/" aria-label="Página inicial"><Logo /></Link>
      <p className="mt-12 font-display text-8xl font-extrabold text-navy-100">404</p>
      <h1 className="mt-2 text-3xl font-extrabold">Página não encontrada</h1>
      <p className="mt-3 max-w-md text-graphite-600">O endereço pode ter mudado ou o item não está mais disponível no site.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn btn-primary">Ir para o início</Link>
        <Link href="/produtos" className="btn btn-outline">Ver produtos</Link>
      </div>
    </main>
  );
}
