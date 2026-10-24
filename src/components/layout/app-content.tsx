export function AppContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 flex flex-col overflow-y-auto pb-28">
      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 py-5">
        {children}
      </div>
    </main>
  )
}
