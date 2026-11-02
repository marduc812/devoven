import type { Metadata } from 'next';
import { HttpSecurityCheck } from '@/Components/Functions/HttpSecurityCheckTools';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/http-security-check', {
  title: 'Security headers test | HTTP headers checker | DevOven',
  description:
    'Test HTTP security headers online by pasting a response. Check CSP, HSTS, X-Frame-Options, cookie flags, and CORS with explanations of missing or weak values.',
});

export default function Page() {
  return (
    <HttpSecurityCheck
      article={
        <ToolArticle
          name="HTTP security headers checker"
          path="/tools/http-security-check"
          description={metadata.description ?? ''}
          category="DeveloperApplication"
          sections={[
            {
              heading: 'Run a security headers test',
              body: (
                <>
                  <p>
                    Copy raw HTTP response headers into the input to inspect
                    their security settings. Get headers from your browser's
                    Network panel, or run{' '}
                    <code>curl -I https://example.com</code>. The checker
                    reports missing headers and warnings about weak values, then
                    gives an overall score.
                  </p>
                  <p>
                    A HEAD response can differ from a normal page response. To
                    inspect headers from a GET request, use{' '}
                    <code>curl -sS -D - -o /dev/null https://example.com</code>.
                    If the response redirects, check the final page's headers
                    separately. This tool analyzes the text you paste and does
                    not fetch the URL itself.
                  </p>
                </>
              ),
            },
            {
              heading: 'What the HTTP headers check covers',
              body: (
                <>
                  <p>
                    The test examines Content-Security-Policy,
                    Strict-Transport-Security, X-Frame-Options,
                    X-Content-Type-Options, Referrer-Policy, Permissions-Policy,
                    and cross-origin policies. It also reviews cookie flags,
                    CORS combinations, and server version disclosure.
                  </p>
                  <p>
                    Read each finding in the context of your application. For
                    example, a CSP needs to allow the resources your pages
                    actually load. The score summarizes these header checks and
                    does not audit application code or prove that a site is
                    secure. If you need to examine a CSP in detail, use the{' '}
                    <a className="underline" href="/tools/csp-analyzer">
                      CSP analyzer
                    </a>
                    .
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question:
                'Can I run this security header test by entering a URL?',
              answer:
                'No. Paste the raw response headers collected with curl or your browser. The checker runs locally on that text and does not request the website.',
            },
            {
              question: 'Why do different pages get different header results?',
              answer:
                'Headers can vary by route, response status, proxy, or request method. Test the actual page and response you want to check, including the final response after a redirect.',
            },
          ]}
        />
      }
    />
  );
}
