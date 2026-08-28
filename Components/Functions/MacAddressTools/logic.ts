export type MacInfo = {
  valid: boolean;
  formatted?: {
    colon: string;      // AA:BB:CC:DD:EE:FF
    dash: string;       // AA-BB-CC-DD-EE-FF
    dot: string;        // AABB.CCDD.EEFF
    plain: string;      // AABBCCDDEEFF
  };
  oui?: string;         // First 6 hex digits (OUI)
  isMulticast?: boolean;
  isLocallyAdministered?: boolean;
  isBroadcast?: boolean;
};

export function parseMac(input: string): MacInfo {
  const cleaned = input.trim().replace(/[:\-\.\s]/g, '').toUpperCase();
  if (!/^[0-9A-F]{12}$/.test(cleaned)) return { valid: false };

  const bytes = cleaned.match(/.{2}/g)!;
  const firstByte = parseInt(bytes[0], 16);

  return {
    valid: true,
    formatted: {
      colon: bytes.join(':'),
      dash: bytes.join('-'),
      dot: `${cleaned.slice(0, 4)}.${cleaned.slice(4, 8)}.${cleaned.slice(8)}`,
      plain: cleaned,
    },
    oui: cleaned.slice(0, 6),
    isMulticast: (firstByte & 1) === 1,
    isLocallyAdministered: (firstByte & 2) === 2,
    isBroadcast: cleaned === 'FFFFFFFFFFFF',
  };
}

export function formatMacInfo(info: MacInfo): string {
  if (!info.valid) return 'Invalid MAC address';
  return [
    `Colon:                ${info.formatted!.colon}`,
    `Dash:                 ${info.formatted!.dash}`,
    `Dot notation:         ${info.formatted!.dot}`,
    `Plain:                ${info.formatted!.plain}`,
    `OUI:                  ${info.oui}`,
    `Multicast:            ${info.isMulticast ? 'Yes' : 'No'}`,
    `Locally administered: ${info.isLocallyAdministered ? 'Yes' : 'No'}`,
    `Broadcast:            ${info.isBroadcast ? 'Yes' : 'No'}`,
  ].join('\n');
}

export function generateRandomMac(): string {
  const bytes = Array.from({ length: 6 }, (_, i) => {
    const b = Math.floor(Math.random() * 256);
    if (i === 0) return (b & 0xfe) | 0x02; // unicast, locally administered
    return b;
  });
  return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
}
