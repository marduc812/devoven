import { decodeSamlRequest, SAML_BINDINGS } from '../Components/Functions/SamlDecoderTools/logic';

const SAMPLE_XML = `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="_abc123" IssueInstant="2024-01-01T00:00:00Z" Destination="https://idp.example.com/sso" AssertionConsumerServiceURL="https://sp.example.com/acs" ProviderName="TestSP"><saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">https://sp.example.com</saml:Issuer></samlp:AuthnRequest>`;

describe('decodeSamlRequest', () => {
  it('returns empty result for empty input', () => {
    const r = decodeSamlRequest('');
    expect(r.raw).toBe('');
    expect(r.fields).toHaveLength(0);
  });

  it('handles raw XML input directly', () => {
    const r = decodeSamlRequest(SAMPLE_XML);
    expect(r.isXml).toBe(true);
    expect(r.fields.length).toBeGreaterThan(0);
  });

  it('extracts ID field from XML', () => {
    const r = decodeSamlRequest(SAMPLE_XML);
    const id = r.fields.find(f => f.name === 'ID');
    expect(id?.value).toBe('_abc123');
  });

  it('extracts IssueInstant from XML', () => {
    const r = decodeSamlRequest(SAMPLE_XML);
    const ts = r.fields.find(f => f.name === 'IssueInstant');
    expect(ts?.value).toBe('2024-01-01T00:00:00Z');
  });

  it('extracts Destination from XML', () => {
    const r = decodeSamlRequest(SAMPLE_XML);
    const dest = r.fields.find(f => f.name === 'Destination');
    expect(dest?.value).toBe('https://idp.example.com/sso');
  });

  it('extracts Issuer from XML', () => {
    const r = decodeSamlRequest(SAMPLE_XML);
    const issuer = r.fields.find(f => f.name === 'Issuer');
    expect(issuer?.value).toContain('sp.example.com');
  });

  it('detects AuthnRequest type', () => {
    const r = decodeSamlRequest(SAMPLE_XML);
    const type = r.fields.find(f => f.name === 'Message Type');
    expect(type?.value).toBe('AuthnRequest');
  });

  it('decodes base64-encoded XML (POST binding)', () => {
    // Base64 encode the XML
    const encoded = Buffer.from(SAMPLE_XML).toString('base64');
    const r = decodeSamlRequest(encoded);
    expect(r.isXml).toBe(true);
    expect(r.fields.find(f => f.name === 'ID')?.value).toBe('_abc123');
  });

  it('returns warnings array', () => {
    const r = decodeSamlRequest(SAMPLE_XML);
    expect(Array.isArray(r.warnings)).toBe(true);
  });

  it('includes xmlPreview for XML input', () => {
    const r = decodeSamlRequest(SAMPLE_XML);
    expect(r.xmlPreview.length).toBeGreaterThan(0);
  });
});

describe('SAML_BINDINGS', () => {
  it('has 4 bindings', () => {
    expect(SAML_BINDINGS.length).toBe(4);
  });

  it('includes HTTP-Redirect and HTTP-POST', () => {
    const names = SAML_BINDINGS.map(b => b.name);
    expect(names).toContain('HTTP-Redirect');
    expect(names).toContain('HTTP-POST');
  });

  it('each binding has name, description, encoding, example', () => {
    for (const b of SAML_BINDINGS) {
      expect(b.name).toBeTruthy();
      expect(b.description).toBeTruthy();
      expect(b.encoding).toBeTruthy();
      expect(b.example).toBeTruthy();
    }
  });

  it('HTTP-Redirect mentions deflate', () => {
    const redirect = SAML_BINDINGS.find(b => b.name === 'HTTP-Redirect');
    expect(redirect?.encoding.toLowerCase()).toContain('deflate');
  });
});
