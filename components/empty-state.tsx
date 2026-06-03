export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[20px] border border-dashed border-ink/15 bg-mist/70 px-5 py-8 text-center">
      <div className="text-lg font-bold text-ink">{title}</div>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-ink/65">{description}</p>
    </div>
  );
}
