'use client'

import Image from "next/image";
import { Globe } from './Globe';

export function HomeContent() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center w-full max-w-7xl">
        <h1 className="text-4xl font-bold mb-4">Global Voice Marketplace</h1>
        
        {/* Globe Visualization */}
        <div className="w-full h-[600px] mb-8">
          <Globe />
        </div>
        
        {/* Marketplace Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <div className="p-6 bg-black/[.05] dark:bg-white/[.06] rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Voice Discovery</h2>
            <p className="text-sm">
              Explore voice talents from around the globe with our interactive 3D visualization.
            </p>
          </div>
          
          <div className="p-6 bg-black/[.05] dark:bg-white/[.06] rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Secure Payments</h2>
            <p className="text-sm">
              Safe and secure transactions powered by Stripe payment processing.
            </p>
          </div>
          
          <div className="p-6 bg-black/[.05] dark:bg-white/[.06] rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Audio Processing</h2>
            <p className="text-sm">
              Advanced NLP and audio processing for quality assurance and analysis.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row mt-8">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="#"
          >
            Explore Voices
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="#"
          >
            List Your Voice
          </a>
        </div>
      </main>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="#"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          About
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="#"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Support
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="#"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Contact →
        </a>
      </footer>
    </div>
  );
}
