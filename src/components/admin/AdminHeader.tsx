export function AdminHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 border-b border-zinc-800 pb-6 md:flex-row md:items-center">
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-gold-400">{eyebrow}</span>
        <h1 className="mt-1 font-serif text-3xl font-light text-white">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}
