export interface CspConfig {
  hasInlineScripts: boolean;
  hasInlineStyles: boolean;
  useNonce: boolean;
  hasUnsafeEval: boolean;
  externalScriptDomains: string;   // comma-separated
  externalStyleDomains: string;    // comma-separated
  externalFontDomains: string;     // comma-separated
  externalImageDomains: string;    // comma-separated
  externalConnectDomains: string;  // comma-separated
  allowForms: boolean;
  allowFrames: boolean;            // whether to allow embedding in iframes
  allowMediaCdn: boolean;
  reportUri: string;
  upgradeInsecure: boolean;
}

export interface CspDirective {
  name: string;
  value: string;
  description: string;
  warning?: string;
}

export interface CspOutput {
  headerValue: string;
  directives: CspDirective[];
  warnings: string[];
  nonceExample: string;
  reportOnlyHeader: string;
}

export const DEFAULT_CSP_CONFIG: CspConfig = {
  hasInlineScripts: false,
  hasInlineStyles: false,
  useNonce: false,
  hasUnsafeEval: false,
  externalScriptDomains: '',
  externalStyleDomains: '',
  externalFontDomains: '',
  externalImageDomains: '',
  externalConnectDomains: '',
  allowForms: true,
  allowFrames: false,
  allowMediaCdn: false,
  reportUri: '',
  upgradeInsecure: true,
};

function parseDomains(raw: string): string[] {
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

export function buildCspPolicy(config: CspConfig): CspOutput {
  const warnings: string[] = [];
  const directives: CspDirective[] = [];

  // default-src
  directives.push({
    name: 'default-src',
    value: "'self'",
    description: "Fallback for all fetch directives. Restricts all content to the same origin by default.",
  });

  // script-src
  const scriptSrc: string[] = ["'self'"];
  if (config.useNonce) {
    scriptSrc.push("'nonce-{NONCE}'");
    scriptSrc.push("'strict-dynamic'"); // strict-dynamic ignores allowlists in nonce mode
  }
  if (config.hasInlineScripts && !config.useNonce) {
    scriptSrc.push("'unsafe-inline'");
    warnings.push("'unsafe-inline' in script-src allows arbitrary inline script execution. Use nonces or hashes instead.");
  }
  if (config.hasUnsafeEval) {
    scriptSrc.push("'unsafe-eval'");
    warnings.push("'unsafe-eval' allows eval(), Function(), setTimeout(string) etc. This significantly weakens XSS protection. Refactor your code to eliminate eval usage.");
  }
  parseDomains(config.externalScriptDomains).forEach(d => scriptSrc.push(d));

  directives.push({
    name: 'script-src',
    value: scriptSrc.join(' '),
    description: "Controls where scripts can be loaded from. The most critical directive for XSS prevention.",
    warning: scriptSrc.includes("'unsafe-inline'") || scriptSrc.includes("'unsafe-eval'") ? 'Contains unsafe directives' : undefined,
  });

  // style-src
  const styleSrc: string[] = ["'self'"];
  if (config.hasInlineStyles && !config.useNonce) {
    styleSrc.push("'unsafe-inline'");
    warnings.push("'unsafe-inline' in style-src allows style injection which can be used for UI redressing or data exfiltration via CSS.");
  }
  if (config.useNonce && config.hasInlineStyles) {
    styleSrc.push("'nonce-{NONCE}'");
  }
  parseDomains(config.externalStyleDomains).forEach(d => styleSrc.push(d));

  directives.push({
    name: 'style-src',
    value: styleSrc.join(' '),
    description: "Controls where stylesheets can be loaded from.",
    warning: styleSrc.includes("'unsafe-inline'") ? 'Contains unsafe-inline' : undefined,
  });

  // font-src
  const fontSrc: string[] = ["'self'"];
  parseDomains(config.externalFontDomains).forEach(d => fontSrc.push(d));
  if (fontSrc.length > 1 || fontSrc[0] !== "'self'") {
    directives.push({
      name: 'font-src',
      value: fontSrc.join(' '),
      description: "Controls where web fonts can be loaded from.",
    });
  }

  // img-src
  const imgSrc: string[] = ["'self'", 'data:'];
  parseDomains(config.externalImageDomains).forEach(d => imgSrc.push(d));
  directives.push({
    name: 'img-src',
    value: imgSrc.join(' '),
    description: "Controls where images can be loaded from. 'data:' is common for base64 embedded images.",
  });

  // connect-src
  const connectSrc: string[] = ["'self'"];
  parseDomains(config.externalConnectDomains).forEach(d => connectSrc.push(d));
  if (connectSrc.length > 1) {
    directives.push({
      name: 'connect-src',
      value: connectSrc.join(' '),
      description: "Controls URLs that can be fetched via XHR, fetch(), WebSocket, EventSource.",
    });
  }

  // media-src
  if (config.allowMediaCdn) {
    directives.push({
      name: 'media-src',
      value: "'self' https:",
      description: "Controls where audio and video can be loaded from.",
    });
  }

  // object-src (always none for security)
  directives.push({
    name: 'object-src',
    value: "'none'",
    description: "Blocks Flash, Java applets, and other plugin content. Always set to 'none' for modern apps.",
  });

  // base-uri
  directives.push({
    name: 'base-uri',
    value: "'self'",
    description: "Restricts the URLs that can be used in <base> elements. Prevents base tag injection.",
  });

  // form-action
  directives.push({
    name: 'form-action',
    value: config.allowForms ? "'self'" : "'none'",
    description: "Restricts the URLs that forms can submit to. Separate from default-src.",
  });

  // frame-ancestors
  directives.push({
    name: 'frame-ancestors',
    value: config.allowFrames ? "'self'" : "'none'",
    description: "Controls which pages can embed this page in an iframe. Replaces the older X-Frame-Options header.",
  });

  // upgrade-insecure-requests
  if (config.upgradeInsecure) {
    directives.push({
      name: 'upgrade-insecure-requests',
      value: '',
      description: "Instructs browsers to upgrade HTTP requests to HTTPS before fetching resources.",
    });
  }

  // report-uri / report-to
  if (config.reportUri.trim()) {
    directives.push({
      name: 'report-uri',
      value: config.reportUri.trim(),
      description: "URL where CSP violation reports are sent. Helps detect attacks and policy issues.",
    });
  }

  // Build header value
  const headerValue = directives
    .map(d => d.value ? `${d.name} ${d.value}` : d.name)
    .join('; ');

  const reportOnlyHeader = `Content-Security-Policy-Report-Only: ${headerValue}`;

  // Nonce example
  const nonceExample = config.useNonce
    ? `// Node.js example:\nconst crypto = require('crypto');\nconst nonce = crypto.randomBytes(16).toString('base64');\nres.setHeader('Content-Security-Policy', cspHeader.replace('{NONCE}', nonce));\n// In HTML:\n<script nonce="${'{nonce}'}">/* your inline script */</script>`
    : '';

  // Wildcard warnings
  const allValues = directives.map(d => d.value).join(' ');
  if (allValues.includes('https:') || allValues.includes('http:')) {
    warnings.push("Using 'https:' or 'http:' as a source allowlists ALL HTTPS/HTTP origins. Use specific domain names for better security.");
  }

  return { headerValue, directives, warnings, nonceExample, reportOnlyHeader };
}

export function validateCspSyntax(policy: string): string[] {
  const errors: string[] = [];
  if (!policy.trim()) return ['Policy is empty'];

  const directivePairs = policy.split(';').map(s => s.trim()).filter(Boolean);
  for (const pair of directivePairs) {
    const [name] = pair.split(/\s+/);
    if (!name) { errors.push('Empty directive found'); continue; }
    // Basic: check for common typos
    if (name.includes('_')) errors.push(`Directive '${name}' uses underscore — should be hyphen (e.g. 'script-src')`);
    if (name.toLowerCase() !== name) errors.push(`Directive '${name}' should be lowercase`);
  }
  if (policy.includes("'unsafe-inline'") && policy.includes("'nonce-")) {
    errors.push("Mixing 'unsafe-inline' and nonce-based CSP: 'unsafe-inline' is ignored in nonce-mode for script-src but may still apply elsewhere");
  }
  return errors;
}
