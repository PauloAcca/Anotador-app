import { redirect } from 'next/navigation'
import { createClient, isMissingTableError } from '@/lib/supabase/server'
import { AVATAR_IMAGES, PROFILE_AVATAR_KEY } from '@/lib/constants'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { TopHeader } from '@/components/layout/top-header'
import { AppContent } from '@/components/layout/app-content'
import { SetupGate } from '@/components/layout/setup-gate'
import { ToastContainer } from '@/components/ui/toast'
import { PwaRegister } from '@/components/pwa/pwa-register'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, timezone')
    .eq('id', user.id)
    .single()

  const displayName = profile?.display_name || user.email
  const metadataAvatar = user.user_metadata?.[PROFILE_AVATAR_KEY]
  const avatarUrl: string | null | undefined =
    metadataAvatar === 'initials'
      ? null
      : typeof metadataAvatar === 'string' &&
          AVATAR_IMAGES.includes(metadataAvatar)
        ? metadataAvatar
        : undefined

  const { error: schemaError } = await supabase
    .from('anotador_habits')
    .select('id', { head: true, count: 'exact' })
    .limit(1)

  if (isMissingTableError(schemaError)) {
    return (
      <>
        <SetupGate displayName={displayName} />
        <ToastContainer />
      </>
    )
  }

  return (
    <div className="flex h-dvh overflow-hidden overscroll-none">
      <Sidebar displayName={displayName} avatarUrl={avatarUrl} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <TopHeader displayName={displayName} avatarUrl={avatarUrl} />
        <AppContent>{children}</AppContent>
      </div>

      <MobileNav />
      <ToastContainer />
      <PwaRegister />
    </div>
  )
}
