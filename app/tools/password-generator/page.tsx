import { PasswordGenerator } from "@/Components/Functions/Tools"
import type { Metadata } from 'next'
import { toolMetadata } from '@/lib/seo';
 
export const metadata: Metadata = toolMetadata('/tools/password-generator', {
    title: 'Secure Online Password Generator',
    description: 'Online strong, unique passwords in seconds with this easy-to-use online generator, powered by JavaScript.'
  });

const page = () => {
    return (
       <>
        <PasswordGenerator />
       </>
    )
}

export default page