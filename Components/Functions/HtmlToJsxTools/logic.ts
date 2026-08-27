const ATTR_MAP: Record<string, string> = {
  'class': 'className',
  'for': 'htmlFor',
  'tabindex': 'tabIndex',
  'readonly': 'readOnly',
  'maxlength': 'maxLength',
  'cellpadding': 'cellPadding',
  'cellspacing': 'cellSpacing',
  'rowspan': 'rowSpan',
  'colspan': 'colSpan',
  'usemap': 'useMap',
  'frameborder': 'frameBorder',
  'contenteditable': 'contentEditable',
  'crossorigin': 'crossOrigin',
  'enctype': 'encType',
  'accesskey': 'accessKey',
  'http-equiv': 'httpEquiv',
};

const VOID_ELEMENTS = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);

export function htmlToJsx(html: string): string {
  let result = html;

  // Convert attributes
  for (const [htmlAttr, jsxAttr] of Object.entries(ATTR_MAP)) {
    const regex = new RegExp(`\\b${htmlAttr}=`, 'gi');
    result = result.replace(regex, `${jsxAttr}=`);
  }

  // Convert style="..." to style={{...}}
  result = result.replace(/style="([^"]*)"/g, (_, styles) => {
    const cssToJs = styles.split(';')
      .map((s: string) => s.trim())
      .filter((s: string) => s)
      .map((s: string) => {
        const [prop, ...vals] = s.split(':');
        const value = vals.join(':').trim();
        const jsProp = prop.trim().replace(/-(\w)/g, (_: string, c: string) => c.toUpperCase());
        return `${jsProp}: '${value}'`;
      })
      .join(', ');
    return `style={{${cssToJs}}}`;
  });

  // Convert boolean attributes
  result = result.replace(/\b(checked|disabled|selected|multiple|required|autofocus|autoplay|controls|loop|muted|open|default|defer|async|allowfullscreen|novalidate)(?=\s|>|\/)/g, '$1={true}');

  // Self-close void elements
  for (const tag of VOID_ELEMENTS) {
    result = result.replace(new RegExp(`<(${tag})([^>]*?)(?<!/)>`, 'gi'), '<$1$2 />');
  }

  // Convert HTML comments to JSX comments
  result = result.replace(/<!--([\s\S]*?)-->/g, (_, content) => `{/*${content}*/}`);

  return result;
}
