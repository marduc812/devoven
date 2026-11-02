import type { Metadata } from 'next';
import { K8sYamlGenerator } from '@/Components/Functions/K8sYamlTools';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/k8s-yaml', {
  title: 'Kubernetes YAML generator online | K8s manifests | DevOven',
  description:
    'Generate Kubernetes YAML online for Deployment, Service, Ingress, ConfigMap, or Secret resources. Set key=value options and copy the resulting manifest.',
});

export default function Page() {
  return (
    <K8sYamlGenerator
      article={
        <ToolArticle
          name="Kubernetes YAML generator"
          path="/tools/k8s-yaml"
          description={metadata.description ?? ''}
          category="DeveloperApplication"
          sections={[
            {
              heading: 'Generate a Kubernetes YAML manifest',
              body: (
                <>
                  <p>
                    Choose a resource type and enter one <code>key=value</code>{' '}
                    option per line. The YAML generator supports Deployment,
                    Service, Ingress, ConfigMap, and Secret resources. The
                    output updates as you edit the options, so you can copy the
                    manifest into your project.
                  </p>
                  <pre className="overflow-x-auto border p-3">
                    <code>{`name=web
namespace=default
image=nginx:1.28
replicas=2
port=80`}</code>
                  </pre>
                  <p>
                    With Deployment selected, these options describe two
                    replicas of a container listening on port 80. Select Service
                    separately to create a service manifest. The tool generates
                    one selected resource at a time.
                  </p>
                </>
              ),
            },
            {
              heading: 'Choose the resource your application needs',
              body: (
                <>
                  <p>
                    A Deployment manages application replicas. A Service
                    provides access to matching pods. An Ingress defines HTTP
                    routing rules for an ingress controller. ConfigMap and
                    Secret resources hold configuration data. Review names,
                    selectors, ports, and namespaces before applying the
                    generated YAML.
                  </p>
                  <p>
                    This generator creates Kubernetes resource templates. For an
                    existing YAML document, use the{' '}
                    <a className="underline" href="/tools/yaml-validator">
                      YAML validator
                    </a>{' '}
                    to check its syntax. YAML syntax validation does not verify
                    whether a Kubernetes cluster accepts the resource.
                    Base64-encoded Secret data is not encryption.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Is this a general-purpose YAML generator?',
              answer:
                'It generates Kubernetes manifests from supported key=value options. It is intended for Deployment, Service, Ingress, ConfigMap, and Secret resources.',
            },
            {
              question: 'Does generating YAML deploy anything?',
              answer:
                'No. The generator only produces text in your browser. Review the manifest and apply it separately using your own Kubernetes tools.',
            },
          ]}
        />
      }
    />
  );
}
