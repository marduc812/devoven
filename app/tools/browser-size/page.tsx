import { ScreenSizeCalculator } from "@/Components/Functions/Tools"
import type { Metadata } from 'next'
 
export const metadata = {
    title: 'What is my browser size?',
    description: 'Quickly find out your browser size with this simple online tool. Know their screen size and resolution in a snap.'
  }

const page = () => {
    return (
       <>
        <ScreenSizeCalculator />
       </>
    )
}

export default page