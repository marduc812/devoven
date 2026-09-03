'use client'

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next'
import { sanitizeAnalyticsUrl } from '@/lib/analytics'

/**
 * The layer that runs for everyone, consent or not.
 *
 * Vercel Web Analytics writes no cookie and reads nothing off the device, so
 * ePrivacy Art 5(3) - the rule the banner exists to satisfy - does not reach
 * it. What is left is a plain page count, which is audience measurement under
 * legitimate interest and is described on /privacy. Anything that identifies a
 * person, or that needs a cookie, stays in AnalyticsGate behind the banner.
 *
 * `beforeSend` is not optional here: tool state travels in the query string,
 * so the URL of a hit can carry whatever the visitor pasted. See lib/analytics.
 */
const stripUserData = (event: BeforeSendEvent) => ({
    ...event,
    url: sanitizeAnalyticsUrl(event.url),
})

const BaselineAnalytics = () => <Analytics beforeSend={stripUserData} />

export default BaselineAnalytics
