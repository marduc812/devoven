// Merkle Tree Visualizer — pure logic, no browser APIs

// Simple SHA-256 implementation for Node/browser-free environments
function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

const K: number[] = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function sha256(input: Uint8Array): Uint8Array {
  const msgLen = input.length;
  const bitLen = msgLen * 8;
  const padLen = ((msgLen + 9) % 64 === 0) ? 64 : (64 - ((msgLen + 9) % 64));
  const padded = new Uint8Array(msgLen + 1 + padLen + 8);
  padded.set(input);
  padded[msgLen] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 4, bitLen, false);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Array<number>(64);

  for (let i = 0; i < padded.length; i += 64) {
    for (let j = 0; j < 16; j++) w[j] = dv.getUint32(i + j * 4, false);
    for (let j = 16; j < 64; j++) {
      const s0 = rightRotate(w[j-15], 7) ^ rightRotate(w[j-15], 18) ^ (w[j-15] >>> 3);
      const s1 = rightRotate(w[j-2], 17) ^ rightRotate(w[j-2], 19) ^ (w[j-2] >>> 10);
      w[j] = (w[j-16] + s0 + w[j-7] + s1) | 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let j = 0; j < 64; j++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[j] + w[j]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0;
      d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }

  const r = new Uint8Array(32);
  const rv = new DataView(r.buffer);
  rv.setUint32(0, h0, false); rv.setUint32(4, h1, false);
  rv.setUint32(8, h2, false); rv.setUint32(12, h3, false);
  rv.setUint32(16, h4, false); rv.setUint32(20, h5, false);
  rv.setUint32(24, h6, false); rv.setUint32(28, h7, false);
  return r;
}

function strToBytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}

function bytesToHex(b: Uint8Array): string {
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
}

function hashLeaf(data: string): string {
  return bytesToHex(sha256(strToBytes(data)));
}

function hashPair(a: string, b: string): string {
  const aBytes = new Uint8Array(32);
  const bBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    aBytes[i] = parseInt(a.slice(i * 2, i * 2 + 2), 16);
    bBytes[i] = parseInt(b.slice(i * 2, i * 2 + 2), 16);
  }
  const combined = new Uint8Array(64);
  combined.set(aBytes, 0);
  combined.set(bBytes, 32);
  return bytesToHex(sha256(combined));
}

export type MerkleNode = {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  isLeaf: boolean;
  label?: string;
};

export type MerkleTreeResult = {
  root: string;
  leaves: string[];
  tree: MerkleNode;
  asciiTree: string;
  proofPath: string[];
};

function buildTree(hashes: string[]): MerkleNode {
  if (hashes.length === 1) {
    return { hash: hashes[0], isLeaf: true };
  }

  const nodes: MerkleNode[] = hashes.map(h => ({ hash: h, isLeaf: true }));

  let current = nodes;
  while (current.length > 1) {
    const next: MerkleNode[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const left = current[i];
      const right = i + 1 < current.length ? current[i + 1] : current[i]; // duplicate last if odd
      const parent: MerkleNode = {
        hash: hashPair(left.hash, right.hash),
        left,
        right,
        isLeaf: false,
      };
      next.push(parent);
    }
    current = next;
  }

  return current[0];
}

function shortHash(h: string): string {
  return h.slice(0, 8) + '...' + h.slice(-4);
}

function buildAscii(node: MerkleNode, prefix: string, isLeft: boolean, isRoot: boolean): string[] {
  const connector = isRoot ? '' : (isLeft ? '├── ' : '└── ');
  const lines: string[] = [`${prefix}${connector}[${shortHash(node.hash)}]${node.isLeaf ? ' (leaf)' : ''}`];

  if (!node.isLeaf && node.left && node.right) {
    const childPrefix = prefix + (isRoot ? '' : (isLeft ? '│   ' : '    '));
    const leftLines = buildAscii(node.left, childPrefix, true, false);
    const rightLines = buildAscii(node.right, childPrefix, false, false);
    lines.push(...leftLines, ...rightLines);
  }

  return lines;
}

function getProofPath(node: MerkleNode, targetHash: string, path: string[]): boolean {
  if (node.isLeaf) return node.hash === targetHash;

  if (node.left && node.right) {
    if (getProofPath(node.left, targetHash, path)) {
      path.push(`sibling: ${shortHash(node.right.hash)}`);
      return true;
    }
    if (getProofPath(node.right, targetHash, path)) {
      path.push(`sibling: ${shortHash(node.left.hash)}`);
      return true;
    }
  }
  return false;
}

export function buildMerkleTree(items: string[]): MerkleTreeResult {
  const nonEmpty = items.filter(s => s.trim().length > 0);
  if (nonEmpty.length === 0) throw new Error('No items provided');
  if (nonEmpty.length > 64) throw new Error('Maximum 64 items supported');

  const leaves = nonEmpty.map(item => hashLeaf(item.trim()));
  const tree = buildTree(leaves);

  const asciiLines = buildAscii(tree, '', false, true);
  const asciiTree = ['Merkle Root', ...asciiLines].join('\n');

  const proofPath: string[] = [];
  getProofPath(tree, leaves[0], proofPath);
  proofPath.unshift(`leaf: ${shortHash(leaves[0])}`);
  proofPath.push(`root: ${shortHash(tree.hash)}`);

  return {
    root: tree.hash,
    leaves,
    tree,
    asciiTree,
    proofPath,
  };
}

/**
 * The tree as horizontal levels: index 0 is the leaves, the last is the root.
 * Mirrors buildTree's pairing (a lone final node is duplicated), so the hashes
 * here are identical to the ones in the MerkleNode tree.
 */
export function merkleLevels(leaves: string[]): string[][] {
  if (leaves.length === 0) return [];
  const levels: string[][] = [leaves.slice()];
  let current = leaves;
  while (current.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const left = current[i];
      const right = i + 1 < current.length ? current[i + 1] : current[i];
      next.push(hashPair(left, right));
    }
    levels.push(next);
    current = next;
  }
  return levels;
}

export interface ProofStep {
  /** 0 is the level just above the leaves. */
  level: number;
  siblingHash: string;
  /** Which side the sibling sits on when hashing the pair. */
  siblingPosition: 'left' | 'right';
  /** Hash produced by combining this node with its sibling. */
  resultHash: string;
  /** True when the node was paired with itself to fill an odd level. */
  duplicated: boolean;
}

/**
 * The sibling hashes needed to recompute the root from one leaf — the thing a
 * Merkle proof actually consists of.
 */
export function merkleProof(leaves: string[], leafIndex: number): ProofStep[] {
  if (leafIndex < 0 || leafIndex >= leaves.length) {
    throw new Error(`Leaf index ${leafIndex} is out of range`);
  }
  const levels = merkleLevels(leaves);
  const steps: ProofStep[] = [];
  let index = leafIndex;

  for (let level = 0; level < levels.length - 1; level++) {
    const nodes = levels[level];
    const isLeft = index % 2 === 0;
    // An odd-sized level pairs the final node with itself.
    const siblingIndex = isLeft ? (index + 1 < nodes.length ? index + 1 : index) : index - 1;
    steps.push({
      level,
      siblingHash: nodes[siblingIndex],
      siblingPosition: isLeft ? 'right' : 'left',
      resultHash: levels[level + 1][Math.floor(index / 2)],
      duplicated: siblingIndex === index,
    });
    index = Math.floor(index / 2);
  }

  return steps;
}
