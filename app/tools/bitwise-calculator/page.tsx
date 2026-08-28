import { BitwiseCalculator } from "@/Components/Functions/DevTools"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Bitwise Calculator - AND, OR, XOR, NOT and more',
    description: 'Perform bitwise operations online. Supports decimal, hex (0x), and binary (0b) inputs. Calculate AND, OR, XOR, NOT, NAND, NOR, left shift, and right shift.',
}

const page = () => {
    return (
        <>
            <BitwiseCalculator />
        </>
    )
}

export default page
