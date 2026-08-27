export type PermissionSet = {
  read: boolean;
  write: boolean;
  execute: boolean;
};

export type PermissionBreakdown = {
  octal: string;
  symbolic: string;
  owner: PermissionSet;
  group: PermissionSet;
  other: PermissionSet;
  description: string;
};

export type CommonPermission = {
  octal: string;
  symbolic: string;
  description: string;
};

export const COMMON_PERMISSIONS: CommonPermission[] = [
  { octal: '777', symbolic: 'rwxrwxrwx', description: 'Full access for everyone (use with caution)' },
  { octal: '755', symbolic: 'rwxr-xr-x', description: 'Owner full; group & others read+execute (typical executable/directory)' },
  { octal: '644', symbolic: 'rw-r--r--', description: 'Owner read+write; group & others read-only (typical file)' },
  { octal: '600', symbolic: 'rw-------', description: 'Owner read+write only (SSH keys, private files)' },
  { octal: '700', symbolic: 'rwx------', description: 'Owner full access only (private executables)' },
  { octal: '664', symbolic: 'rw-rw-r--', description: 'Owner & group read+write; others read-only' },
  { octal: '666', symbolic: 'rw-rw-rw-', description: 'Read+write for everyone (no execute)' },
  { octal: '640', symbolic: 'rw-r-----', description: 'Owner read+write; group read-only; others none' },
  { octal: '444', symbolic: 'r--r--r--', description: 'Read-only for everyone' },
  { octal: '400', symbolic: 'r--------', description: 'Read-only for owner' },
  { octal: '000', symbolic: '---------', description: 'No permissions for anyone' },
];

function octetToPermSet(octet: number): PermissionSet {
  return {
    read: (octet & 4) !== 0,
    write: (octet & 2) !== 0,
    execute: (octet & 1) !== 0,
  };
}

function permSetToString(p: PermissionSet): string {
  return (p.read ? 'r' : '-') + (p.write ? 'w' : '-') + (p.execute ? 'x' : '-');
}

function buildDescription(owner: PermissionSet, group: PermissionSet, other: PermissionSet): string {
  const parts: string[] = [];
  const ownerStr = permSetToString(owner);
  const groupStr = permSetToString(group);
  const otherStr = permSetToString(other);
  parts.push('Owner (' + ownerStr + ')');
  parts.push('Group (' + groupStr + ')');
  parts.push('Others (' + otherStr + ')');
  return parts.join(', ');
}

export function parseOctal(octal: string): PermissionBreakdown {
  const trimmed = octal.trim();
  if (!/^[0-7]{1,4}$/.test(trimmed)) {
    throw new Error('Invalid octal. Use 1-4 digits (0-7), e.g. 755 or 0755');
  }
  // Normalize to 3 digits (ignore leading 0 for setuid/setgid/sticky)
  const normalized = trimmed.replace(/^0/, '');
  const padded = normalized.padStart(3, '0');
  if (padded.length > 3) {
    throw new Error('Octal must be 3 digits (0-7), e.g. 755');
  }

  const ownerOctet = parseInt(padded[0], 8);
  const groupOctet = parseInt(padded[1], 8);
  const otherOctet = parseInt(padded[2], 8);

  const owner = octetToPermSet(ownerOctet);
  const group = octetToPermSet(groupOctet);
  const other = octetToPermSet(otherOctet);

  const symbolic = permSetToString(owner) + permSetToString(group) + permSetToString(other);

  return {
    octal: padded,
    symbolic,
    owner,
    group,
    other,
    description: buildDescription(owner, group, other),
  };
}

export function parseSymbolic(symbolic: string): PermissionBreakdown {
  const trimmed = symbolic.trim();
  // Accept optional leading '-' or 'd' (file type indicator)
  const stripped = trimmed.length === 10 ? trimmed.slice(1) : trimmed;
  if (stripped.length !== 9 || !/^[rwx-]{9}$/.test(stripped)) {
    throw new Error('Invalid symbolic notation. Use 9-char format like rwxr-xr-x');
  }

  function parseTriple(s: string): PermissionSet {
    return {
      read: s[0] === 'r',
      write: s[1] === 'w',
      execute: s[2] === 'x',
    };
  }

  const owner = parseTriple(stripped.slice(0, 3));
  const group = parseTriple(stripped.slice(3, 6));
  const other = parseTriple(stripped.slice(6, 9));

  function permSetToOctet(p: PermissionSet): number {
    return (p.read ? 4 : 0) + (p.write ? 2 : 0) + (p.execute ? 1 : 0);
  }

  const octal =
    permSetToOctet(owner).toString() +
    permSetToOctet(group).toString() +
    permSetToOctet(other).toString();

  return {
    octal,
    symbolic: stripped,
    owner,
    group,
    other,
    description: buildDescription(owner, group, other),
  };
}

export function parsePermissions(input: string): PermissionBreakdown {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Please enter an octal (e.g. 755) or symbolic (e.g. rwxr-xr-x) permission');

  // If it looks like octal
  if (/^[0-7]{1,4}$/.test(trimmed)) {
    return parseOctal(trimmed);
  }
  // If it looks like symbolic
  if (/^[-d]?[rwx-]{9}$/.test(trimmed)) {
    return parseSymbolic(trimmed);
  }

  throw new Error('Unrecognized format. Enter an octal (e.g. 755) or symbolic (e.g. rwxr-xr-x) notation');
}
