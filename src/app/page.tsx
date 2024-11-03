import { GlobeWrapper } from '../components/GlobeWrapper'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="w-full h-screen">
        <GlobeWrapper />
      </div>
    </main>
  )
}
