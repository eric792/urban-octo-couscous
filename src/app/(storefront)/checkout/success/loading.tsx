import { Loader2 } from "lucide-react";

export default function SuccessLoading() {
  return (
    <div className="container-luxe flex max-w-3xl flex-col items-center py-24 text-center" role="status">
      <Loader2 className="h-12 w-12 animate-spin text-gold-400" strokeWidth={1.2} />
      <p className="mt-6 font-serif text-3xl text-white">Confirming your order…</p>
      <p className="mt-2 text-sm text-zinc-500">Please don&apos;t close this page.</p>
    </div>
  );
}
