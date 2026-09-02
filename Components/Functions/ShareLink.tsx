'use client'

/**
 * One share link per tool page.
 *
 * Every tool reads its state out of the query string on mount (`?from=…` plus
 * whatever options it has). This is the mirror of that: a tool publishes the
 * same values back here, and the single "Copy link" button in the page header
 * turns them into a URL that restores the whole tool, not just one field.
 *
 * Two slots feed one link:
 *   - `base`  the view primitive (BasicConverter / AdvancedConverter) publishes
 *             the input textarea as `from`, so every text tool works with no
 *             wiring of its own.
 *   - `tool`  the tool publishes its options, and may override `from` (Panel
 *             tools have no textarea of their own, so they publish everything).
 *
 * The store is a mutable ref with subscribers rather than React state: tools
 * publish on every keystroke, and the provider wraps the whole app, so putting
 * this in state would re-render the header, footer and page on each character.
 * Only the copy button subscribes.
 *
 * Entries are tagged with the pathname they were published from. The provider
 * sits in the root layout and outlives navigation, so a stale entry from the
 * tool you just left is ignored rather than leaking into the next link.
 */

import React, { createContext, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'

export type ShareParamValue = string | number | boolean | null | undefined
export type ShareParams = Record<string, ShareParamValue>

type Slot = 'base' | 'tool'
type Entry = { path: string; params: Record<string, string> }

type Store = {
    publish: (slot: Slot, entry: Entry | null) => void
    subscribe: (listener: () => void) => () => void
    /** Serialized `{ base, tool }` - a string, so it is a stable snapshot. */
    snapshot: () => string
}

const ShareLinkContext = createContext<Store | null>(null)

const EMPTY = '{}'

/**
 * Drops what should never end up in a link: empty fields, and anything the tool
 * passed as `null`/`undefined` because it has no value yet. Numbers and booleans
 * are stringified so the query string reads the way a hand-written one would.
 */
const normalize = (params: ShareParams): Record<string, string> => {
    const out: Record<string, string> = {}
    for (const [key, value] of Object.entries(params)) {
        if (value === null || value === undefined || value === '') continue
        out[key] = typeof value === 'string' ? value : String(value)
    }
    return out
}

export const ShareLinkProvider = ({ children }: { children: React.ReactNode }) => {
    const store = useRef<Store | null>(null)

    if (store.current === null) {
        const entries: Partial<Record<Slot, Entry | null>> = {}
        const listeners = new Set<() => void>()
        let snapshot = EMPTY

        store.current = {
            publish: (slot, entry) => {
                entries[slot] = entry
                const next = JSON.stringify(entries)
                if (next === snapshot) return
                snapshot = next
                listeners.forEach((listener) => listener())
            },
            subscribe: (listener) => {
                listeners.add(listener)
                return () => listeners.delete(listener)
            },
            snapshot: () => snapshot,
        }
    }

    return <ShareLinkContext.Provider value={store.current}>{children}</ShareLinkContext.Provider>
}

/**
 * Publish the current tool state. Call it with the same keys the tool reads back
 * out of the query string, so a copied link round-trips:
 *
 *     useShareLink({ from: fromValue, salt, variant, t: time })
 *
 * Safe to call with a fresh object every render - only a change in the resulting
 * query string reaches the store.
 */
export const useShareLink = (params: ShareParams, slot: Slot = 'tool') => {
    const store = useContext(ShareLinkContext)
    const path = usePathname()
    const serialized = JSON.stringify(normalize(params))

    useEffect(() => {
        if (!store) return
        store.publish(slot, { path, params: JSON.parse(serialized) as Record<string, string> })
        return () => store.publish(slot, null)
    }, [store, slot, path, serialized])
}

/** The query string for the current page, without the leading `?`. */
export const useShareLinkQuery = (): string => {
    const store = useContext(ShareLinkContext)
    const path = usePathname()
    const snapshot = useSyncExternalStore(
        store ? store.subscribe : () => () => {},
        store ? store.snapshot : () => EMPTY,
        () => EMPTY,
    )

    return useMemo(() => {
        const entries = JSON.parse(snapshot) as Partial<Record<Slot, Entry | null>>
        const merged: Record<string, string> = {}
        for (const slot of ['base', 'tool'] as const) {
            const entry = entries[slot]
            if (!entry || entry.path !== path) continue
            Object.assign(merged, entry.params)
        }
        return new URLSearchParams(merged).toString()
    }, [snapshot, path])
}
