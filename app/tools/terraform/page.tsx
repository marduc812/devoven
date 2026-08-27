import { TerraformGenerator } from "@/Components/Functions/TerraformTools"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Terraform Variable Generator - Generate HCL variable blocks online',
    description: 'Generate Terraform HCL variable blocks from definitions, convert .tfvars to -var CLI flags, or convert -var flags back to .tfvars format.',
}

const page = () => {
    return (
        <>
            <TerraformGenerator />
        </>
    )
}

export default page
