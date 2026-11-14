"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-extrabold">Algo não saiu como esperado.</h1>
      <p className="mt-3 max-w-md text-graphite-600">Tente novamente em instantes. Se preferir, fale com a loja pelo telefone (18) 3321-1449.</p>
      <div className="mt-8 flex gap-3">
        <button onClick={reset} className="btn btn-primary">Tentar novamente</button>
        <Link href="/" className="btn btn-outline">Início</Link>
      </div>
    </main>
  );
}
