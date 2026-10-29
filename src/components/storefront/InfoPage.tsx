export function InfoPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container-luxe max-w-3xl py-16">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 font-serif text-5xl font-light text-white">{title}</h1>
      {intro && <p className="mt-4 text-lg text-zinc-400">{intro}</p>}
      <div className="mt-12 space-y-10 text-[15px] leading-relaxed text-zinc-400 [&_h2]:mb-3 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_li]:marker:text-gold-500 [&_strong]:text-zinc-200">
        {children}
      </div>
    </div>
  );
}
