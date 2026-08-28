'use client'
import React, { useEffect, useState } from 'react'

// Four logo variants, one picked at random per page load (in useEffect, so
// SSR and hydration always agree on the fallback wordmark).

const Wordmark = () => (
  <span className="font-black text-sm leading-tight text-gray-900 dark:text-white tracking-tight text-center uppercase">
    Dev<br />Oven
  </span>
)

/* 1 — The Oven Door: door swings open revealing </> baking inside */
const OvenDoorLogo = () => (
  <span className="flex items-center gap-2.5">
    <span className="relative block w-9 h-9 border-2 border-black dark:border-white bg-white dark:bg-zinc-950 [perspective:200px]">
      {/* knobs */}
      <span className="flex items-center justify-center gap-1 h-2.5 border-b-2 border-black dark:border-white">
        <span className="w-1 h-1 rounded-full bg-black dark:bg-white transition-colors group-hover:bg-amber-500 dark:group-hover:bg-amber-500" />
        <span className="w-1 h-1 rounded-full bg-black dark:bg-white transition-colors delay-75 group-hover:bg-teal-500 dark:group-hover:bg-teal-500" />
        <span className="w-1 h-1 rounded-full bg-black dark:bg-white transition-colors delay-150 group-hover:bg-indigo-500 dark:group-hover:bg-indigo-500" />
        <span className="w-1 h-1 rounded-full bg-black dark:bg-white transition-colors delay-200 group-hover:bg-emerald-500 dark:group-hover:bg-emerald-500" />
      </span>
      {/* glowing cavity behind the door */}
      <span className="absolute inset-x-0 top-2.5 bottom-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_65%,#fbbf24_0%,#f59e0b_50%,#b45309_100%)]">
        <span className="text-[9px] font-black text-amber-950">&lt;/&gt;</span>
      </span>
      {/* door */}
      <span className="absolute inset-x-0 top-2.5 bottom-0 flex flex-col items-center justify-center gap-[3px] bg-white dark:bg-zinc-950 origin-bottom transition-transform duration-500 ease-[cubic-bezier(.6,0,.3,1)] group-hover:[transform:rotateX(-80deg)]">
        <span className="w-5 h-0.5 rounded bg-black dark:bg-white" />
        <span className="w-5 h-2.5 border-[1.5px] border-black dark:border-white bg-gradient-to-b from-amber-200/60 to-amber-400/70" />
      </span>
    </span>
    <span className="font-black text-sm leading-tight tracking-tight text-left uppercase text-gray-900 dark:text-white">
      Dev<br /><span className="text-amber-500 transition-colors group-hover:text-amber-600">Oven</span>
    </span>
  </span>
)

/* 2 — The Dial: the O is an oven dial that cranks to max heat */
const DialLogo = () => (
  <span className="flex items-center font-black text-base tracking-tight uppercase text-gray-900 dark:text-white">
    DEV
    <span className="relative block w-6 h-6 mx-0.5 rounded-full border-2 border-black dark:border-white transition-[border-color,box-shadow] duration-300 group-hover:border-amber-500 dark:group-hover:border-amber-500 group-hover:shadow-[0_0_0_3px_rgba(245,158,11,.2),0_0_14px_rgba(245,158,11,.5)]">
      <span className="absolute left-1/2 top-1/2 w-0.5 h-2.5 -ml-[1px] rounded bg-black dark:bg-white origin-top transition-transform duration-700 ease-[cubic-bezier(.34,1.4,.5,1)] [transform:rotate(225deg)] group-hover:[transform:rotate(495deg)] group-hover:bg-amber-600 dark:group-hover:bg-amber-500" />
      <span className="absolute left-1/2 top-1/2 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-black dark:bg-white transition-colors group-hover:bg-amber-600 dark:group-hover:bg-amber-500" />
    </span>
    VEN
  </span>
)

/* 3 — The Four Burners: category panes ignite in their colors */
const BurnersLogo = () => (
  <span className="flex items-center gap-2.5">
    <span className="grid grid-cols-2 border-2 border-black dark:border-white">
      <span className="flex items-center justify-center w-4 h-4 text-[7px] font-bold border-r-2 border-b-2 border-black dark:border-white text-gray-900 dark:text-white bg-white dark:bg-zinc-950 transition-colors group-hover:bg-amber-500 group-hover:text-white dark:group-hover:bg-amber-500">{'{}'}</span>
      <span className="flex items-center justify-center w-4 h-4 text-[8px] font-bold border-b-2 border-black dark:border-white text-gray-900 dark:text-white bg-white dark:bg-zinc-950 transition-colors delay-100 group-hover:bg-teal-500 group-hover:text-white dark:group-hover:bg-teal-500">#</span>
      <span className="flex items-center justify-center w-4 h-4 text-[8px] font-bold border-r-2 border-black dark:border-white text-gray-900 dark:text-white bg-white dark:bg-zinc-950 transition-colors delay-200 group-hover:bg-indigo-500 group-hover:text-white dark:group-hover:bg-indigo-500">⇄</span>
      <span className="flex items-center justify-center w-4 h-4 text-[8px] font-bold text-gray-900 dark:text-white bg-white dark:bg-zinc-950 transition-colors delay-300 group-hover:bg-emerald-500 group-hover:text-white dark:group-hover:bg-emerald-500">✦</span>
    </span>
    <span className="relative font-black text-sm leading-tight tracking-tight text-left uppercase text-gray-900 dark:text-white after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[3px] after:w-0 after:bg-gradient-to-r after:from-amber-500 after:via-teal-500 after:to-emerald-500 after:transition-[width] after:duration-500 group-hover:after:w-full">
      Dev<br />Oven
    </span>
  </span>
)

/* 4 — Freshly Baked: a </> loaf pops out of the slot with steam */
const LoafLogo = () => (
  <span className="flex items-end gap-2">
    <span className="relative flex items-end justify-center w-9 h-8">
      {/* steam */}
      <span className="absolute inset-x-0 -top-1 h-4 pointer-events-none">
        <span className="absolute left-[35%] top-2 w-[3px] h-2 rounded bg-gray-400 dark:bg-zinc-500 opacity-0 group-hover:animate-[logo-steam_1.2s_.1s_infinite]" />
        <span className="absolute left-[55%] top-2 w-[3px] h-2 rounded bg-gray-400 dark:bg-zinc-500 opacity-0 group-hover:animate-[logo-steam_1.2s_.6s_infinite]" />
      </span>
      {/* loaf, clipped so it hides behind the slot until hover */}
      <span className="absolute inset-x-0 bottom-1 h-7 overflow-hidden flex items-end justify-center pointer-events-none">
        <span className="flex items-center justify-center w-6 h-[18px] border-2 border-black dark:border-white rounded-t-full bg-gradient-to-b from-amber-200 to-amber-500 text-[7px] font-black text-amber-950 translate-y-[12px] transition-transform duration-500 ease-[cubic-bezier(.34,1.45,.5,1)] group-hover:translate-y-0">&lt;/&gt;</span>
      </span>
      {/* slot */}
      <span className="relative z-10 block w-9 h-1.5 border-2 border-black dark:border-white bg-white dark:bg-zinc-950" />
    </span>
    <span className="font-black text-sm tracking-tight lowercase text-gray-900 dark:text-white leading-none pb-0.5">
      dev<span className="text-amber-500 transition-colors group-hover:text-amber-600">oven</span>
    </span>
  </span>
)

const variants = [OvenDoorLogo, DialLogo, BurnersLogo, LoafLogo]

const Logo = () => {
  const [variant, setVariant] = useState<number | null>(null)

  useEffect(() => {
    setVariant(Math.floor(Math.random() * variants.length))
  }, [])

  if (variant === null) return <Wordmark />

  const Variant = variants[variant]
  return <Variant />
}

export default Logo
