export default function AppLoading() {
  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="skeleton h-7 w-40" />
      <div className="skeleton h-4 w-64" />
      <div className="rounded-[var(--radius-lg)] glass p-5 mt-2">
        <div className="flex items-center gap-5">
          <div className="skeleton h-16 w-16 rounded-full" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-3 w-48" />
          </div>
        </div>
      </div>
      <div className="rounded-[var(--radius-lg)] glass p-5 flex flex-col gap-3">
        <div className="skeleton h-4 w-28" />
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-12 w-full" />
      </div>
    </div>
  )
}
