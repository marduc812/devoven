import { GmapsApiScanner } from "@/Components/Functions/GmapsApiScannerTools"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Google Maps API Key Scanner - Check for Misconfigured Keys',
    description: 'Scan a Google Maps API key to check if it has unrestricted access to billable APIs. Tests Static Maps, Directions, Places, Geocoding, Roads, and more.',
}

const page = () => {
    return <GmapsApiScanner />
}

export default page
