export default function Loading() {
  return (
    <div className="shell space-y-8 animate-pulse">
      <div className="panel px-6 py-8 sm:px-8">
        <div className="h-4 w-24 rounded-full bg-ink/10" />
        <div className="mt-4 h-8 w-64 rounded-full bg-ink/10" />
        <div className="mt-3 h-4 w-96 rounded-full bg-ink/8" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel px-6 py-8 h-48" />
        <div className="panel px-6 py-8 h-48" />
      </div>
    </div>
  );
}
