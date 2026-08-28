'use client'

import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import { GA_TRACKING_ID } from '@/Components/Functions/gtag'
import { useConsent } from './ConsentProvider'

/**
 * Loads the analytics scripts, and only once someone has accepted. Before that
 * - and after a decline - nothing here renders, so no request is made and no
 * cookie is written.
 */
const AnalyticsGate = () => {
    const { consent } = useConsent()

    if (consent !== 'accepted') return null

    return (
        <>
            {GA_TRACKING_ID && (
                <>
                    <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`} />
                    <Script id="google-analytics">
                        {`
                  if (window.location.hostname!=='localhost'){
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());

                    gtag('config', '${GA_TRACKING_ID}');
                  }
                `}
                    </Script>
                </>
            )}
            <Analytics />
        </>
    )
}

export default AnalyticsGate
