import  NmapMainView  from "@/Components/Functions/NmapViewer/NmapMainView"
import type { Metadata } from 'next'
 
export const metadata = {
  title: 'View Nmap Scans Online in a clean GUI',
  description: 'Preview your Nmap scan results with a clean GUI, securely, without installing any software'
}


const page = () => {
    return (
       <NmapMainView />
    )
}

export default page