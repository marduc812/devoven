import { K8sYamlGenerator } from "@/Components/Functions/K8sYamlTools"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'K8s YAML Generator - Generate Kubernetes YAML online',
    description: 'Generate Kubernetes Deployment, Service, Ingress, ConfigMap, and Secret YAML manifests from simple key=value options.',
}

const page = () => {
    return (
        <>
            <K8sYamlGenerator />
        </>
    )
}

export default page
