import type { Metadata } from 'next';
import { TerraformVarsGenerator } from '@/Components/Functions/TerraformVarsTools';

export const metadata: Metadata = {
  title: 'Terraform Variable Generator | DevOven',
  description: 'Generate Terraform variables.tf and terraform.tfvars files from a JSON object or key=value pairs. Automatically infers types: string, number, bool, list(string), map(string), object().',
};

export default function Page() {
  return <TerraformVarsGenerator />;
}
