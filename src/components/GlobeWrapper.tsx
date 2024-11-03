'use client'

import dynamic from 'next/dynamic'

// Import Globe component dynamically to avoid SSR issues with globe.gl
const Globe = dynamic(() => import('./Globe').then(mod => ({ default: mod.Globe })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] flex items-center justify-center bg-black/[.05] dark:bg-white/[.06] rounded-lg">
      <div className="text-lg">Loading Interactive Globe...</div>
    </div>
  )
})

export function GlobeWrapper() {
  return (
    <div className="w-full h-screen relative">
      <Globe />
    </div>
  )
}
