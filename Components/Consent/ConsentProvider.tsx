'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { GA_TRACKING_ID } from '@/Components/Functions/gtag'
import { ConsentChoice, clearAnalyticsCookies, readConsent, writeConsent } from '@/lib/consent'

type ConsentContextValue = {
    /** null means the visitor has not answered, which counts as "do not track". */
    consent: ConsentChoice | null
    /** False until localStorage has been read, so the banner never flashes on first paint. */
    ready: boolean
    bannerOpen: boolean
    accept: () => void
    decline: () => void
    /** Reopens the banner so a choice can be changed later. */
    reopen: () => void
}

const ConsentContext = createContext<ConsentContextValue | null>(null)

/**
 * Google's documented kill switch. The tag script may already be in the page
 * from an earlier "accept", and unmounting the <Script> does not unload it, so
 * withdrawing consent has to silence gtag directly.
 */
function setGaDisabled(disabled: boolean) {
    if (!GA_TRACKING_ID || typeof window === 'undefined') return
    ;(window as unknown as Record<string, boolean>)[`ga-disable-${GA_TRACKING_ID}`] = disabled
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
    const [consent, setConsentState] = useState<ConsentChoice | null>(null)
    const [ready, setReady] = useState(false)
    const [reopened, setReopened] = useState(false)

    useEffect(() => {
        const stored = readConsent()
        setGaDisabled(stored !== 'accepted')
        setConsentState(stored)
        setReady(true)
    }, [])

    const accept = useCallback(() => {
        writeConsent('accepted')
        setGaDisabled(false)
        setConsentState('accepted')
        setReopened(false)
    }, [])

    const decline = useCallback(() => {
        writeConsent('declined')
        setGaDisabled(true)
        clearAnalyticsCookies()
        setConsentState('declined')
        setReopened(false)
    }, [])

    const reopen = useCallback(() => setReopened(true), [])

    const value = useMemo<ConsentContextValue>(
        () => ({
            consent,
            ready,
            bannerOpen: ready && (consent === null || reopened),
            accept,
            decline,
            reopen,
        }),
        [consent, ready, reopened, accept, decline, reopen]
    )

    return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
}

export function useConsent(): ConsentContextValue {
    const value = useContext(ConsentContext)
    if (!value) throw new Error('useConsent must be used inside a ConsentProvider')
    return value
}
