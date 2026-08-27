import { WiFiQRCodeGenerator } from "@/Components/Functions/Tools"
import type { Metadata } from 'next'
 
export const metadata = {
    title: 'Online WiFi QR Code Generator',
    description: 'Generate a QR code for your WiFi easily and securely with one click. Unlimited style and color options without the need to sign up.'
  }

const page = () => {
    return (
       <>
        <WiFiQRCodeGenerator />
       </>
    )
}

export default page