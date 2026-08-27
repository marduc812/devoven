'use client'
import Link from 'next/link'
import React, { useState } from 'react'
import { IoSearch, IoMenu, IoClose } from 'react-icons/io5'
import ThemeToggle from '@/Components/ThemeToggle'
import Logo from '@/Components/Navigation/Logo'

const navItems = [
  { label: 'Blocks', href: '/blocks' },
  { label: 'Encode',  href: '/#encode'  },
  { label: 'Hash',    href: '/#hash'    },
  { label: 'Convert', href: '/#convert' },
  { label: 'Tools',   href: '/#tools'   },
]

const NavigationHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-zinc-950 border-b border-gray-900 dark:border-white/15">
      <div className="flex items-stretch h-12">

        {/* Logo */}
        <Link href="/" prefetch={false} className="group flex items-center justify-center px-5 border-r border-gray-900 dark:border-white/15 min-w-[80px] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          <Logo />
        </Link>

        {/* Nav items — desktop */}
        <div className="hidden md:flex flex-1 items-center px-6 gap-6">
          {navItems.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className="text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors uppercase tracking-wide"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Spacer for mobile */}
        <div className="flex-1 md:hidden" />

        {/* Search + Theme toggle + Hamburger */}
        <div className="flex items-stretch flex-shrink-0">
          <Link
            href="/search"
            prefetch={false}
            className="flex items-center gap-2 px-5 border-l border-gray-900 dark:border-white/15 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm font-medium uppercase tracking-wide"
          >
            <IoSearch className="text-base" />
            <span className="hidden sm:inline">Search</span>
          </Link>
          <div className="flex items-center px-3 border-l border-gray-900 dark:border-white/15">
            <ThemeToggle />
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex md:hidden items-center px-4 border-l border-gray-900 dark:border-white/15 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <IoClose className="text-xl" /> : <IoMenu className="text-xl" />}
          </button>
        </div>

      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-900 dark:border-white/15">
          {navItems.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-3 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors uppercase tracking-wide border-b border-gray-200 dark:border-white/10 last:border-b-0"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}

export default NavigationHeader
