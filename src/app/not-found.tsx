import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-900 px-6 text-center">
      <p className="font-serif text-2xl tracking-[0.3em] text-gold-400">ZEN AMOUR</p>
      <h1 className="mt-10 font-serif text-6xl font-light text-white">Page not found</h1>
      <p className="mt-4 max-w-md text-zinc-400">The page you&apos;re looking for has moved or no longer exists.</p>
      <div className="mt-10 flex gap-4">
        <Link href="/" className="btn-gold">Home</Link>
        <Link href="/shop" className="btn-outline">Shop</Link>
      </div>
    </div>
  );
}
