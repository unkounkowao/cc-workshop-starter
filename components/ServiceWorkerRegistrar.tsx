'use client'
import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/cc-workshop-starter/sw.js', {
        scope: '/cc-workshop-starter/',
      })
    }
  }, [])

  return null
}
