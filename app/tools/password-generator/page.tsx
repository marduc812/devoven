import { PasswordGenerator } from "@/Components/Functions/Tools"
import type { Metadata } from 'next'
 
export const metadata = {
    title: 'Secure Online Password Generator',
    description: 'Online strong, unique passwords in seconds with this easy-to-use online generator, powered by JavaScript.'
  }

const page = () => {
    return (
       <>
        <PasswordGenerator />
       </>
    )
}

export default page