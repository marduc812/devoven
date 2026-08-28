'use client'

import { useConsent } from './ConsentProvider'

/** Footer link that brings the banner back so the choice can be changed. */
const CookiePreferencesLink = () => {
    const { bannerOpen, reopen } = useConsent()

    if (bannerOpen) return null

    return (
        <button
            type="button"
            onClick={reopen}
            className="text-gray-400 text-sm hover:text-gray-900 dark:hover:text-white transition-colors"
        >
            Cookies
        </button>
    )
}

export default CookiePreferencesLink
