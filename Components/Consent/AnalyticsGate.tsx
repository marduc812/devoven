'use client'

import Script from 'next/script'
import { GA_TRACKING_ID } from '@/Components/Functions/gtag'
import { useConsent } from './ConsentProvider'

/**
 * Google Analytics, and only once someone has accepted. Before that - and
 * after a decline - nothing here renders, so no request is made and no cookie
 * is written. GA needs consent: it writes cookies and sends to Google, so no
 * audience-measurement exemption covers it.
 *
 * The cookieless page count that runs either way lives in BaselineAnalytics.
 *
 * `page_location` is pinned to the bare path because tool state travels in the
 * query string. Enhanced measurement re-reads the address bar on history
 * changes, so leave its "page changes" trigger off in the GA property or the
 * query string comes back in on client-side navigation.
 */
const AnalyticsGate = () => {
    const { consent } = useConsent()

    if (consent !== 'accepted' || !GA_TRACKING_ID) return null

    return (
        <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`} />
            <Script id="google-analytics">
                {`
                  if (window.location.hostname!=='localhost'){
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());

                    gtag('config', '${GA_TRACKING_ID}', {
                      page_location: window.location.origin + window.location.pathname
                    });
                  }
                `}
            </Script>
        </>
    )
}

export default AnalyticsGate
