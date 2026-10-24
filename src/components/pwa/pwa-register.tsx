'use client'

import { useEffect } from 'react'
import { toast } from '@/components/ui/toast'
import {
  setDeferredPrompt,
  type BeforeInstallPromptEvent,
} from '@/lib/pwa'

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch(() => {
        /* silencioso: la app funciona sin SW */
      })
  }, [])

  useEffect(() => {
    function handleInstallPrompt(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
    }
  }, [])

  useEffect(() => {
    function handleOffline() {
      toast.warning('Sin conexión. Podés seguir navegando lo que ya cargaste.')
    }
    function handleOnline() {
      toast.success('Volviste a estar en línea.')
    }
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  return null
}
