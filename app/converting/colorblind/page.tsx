import { ColorblindSimulator } from "@/Components/Functions/ColorblindTools/index"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Colorblind Simulator — See Colors as Colorblind Users Do',
    description: 'Simulate how hex colors appear to people with Protanopia, Deuteranopia, Tritanopia, and Achromatopsia. Essential tool for accessible design.'
}

const page = () => {
    return (
        <ColorblindSimulator />
    )
}

export default page
