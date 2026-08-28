import { RelativeLuminanceCalculator } from "@/Components/Functions/Tools"
import type { Metadata } from 'next'
 
export const metadata = {
  title: 'Online Color Relative Luminance Calculator',
  description: 'Easily calculate the relative luminance of colors with this intuitive online tool. Great for designers and developers for accessibility and design quality.'
}


const page = () => {
    return (
       <>
        <RelativeLuminanceCalculator />
       </>
    )
}

export default page