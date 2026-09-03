'use client'

import Link from 'next/link'
import { useConsent } from './ConsentProvider'

const CookieBanner = () => {
    const { bannerOpen, accept, decline } = useConsent()

    if (!bannerOpen) return null

    return (
        <div
            role="region"
            aria-label="Cookie consent"
            className="fixed bottom-4 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] border border-gray-900 bg-white p-4 shadow-lg"
        >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-900">Cookies</p>
            <p className="mt-2 text-sm text-gray-600">
                We count page views without cookies either way, to know which tools get used.
                Accept and Google Analytics is loaded too, which does set cookies. Decline and
                it never loads. What you type into a tool stays in your browser regardless.
            </p>
            <p className="mt-2 text-sm text-gray-600">
                <Link href="/privacy" prefetch={false} className="underline hover:text-gray-900">
                    What we collect
                </Link>
            </p>
            <div className="mt-4 flex flex-row gap-2">
                <button
                    type="button"
                    onClick={accept}
                    className="flex-1 bg-amber-400 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-black transition-colors duration-150 hover:bg-amber-500"
                >
                    Accept
                </button>
                <button
                    type="button"
                    onClick={decline}
                    className="flex-1 border border-gray-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
                >
                    Decline
                </button>
            </div>
        </div>
    )
}

export default CookieBanner
