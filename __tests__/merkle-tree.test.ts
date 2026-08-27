import { buildMerkleTree, merkleLevels, merkleProof } from '@/Components/Functions/MerkleTreeTools/logic';

describe('merkleLevels', () => {
  it('returns nothing for no leaves', () => expect(merkleLevels([])).toEqual([]));

  it('a single leaf is its own root level', () => {
    const { leaves } = buildMerkleTree(['only']);
    expect(merkleLevels(leaves)).toEqual([leaves]);
  });

  it('halves each level up to a single root', () => {
    const { leaves } = buildMerkleTree(['a', 'b', 'c', 'd']);
    const levels = merkleLevels(leaves);
    expect(levels.map(l => l.length)).toEqual([4, 2, 1]);
  });

  it('top level matches the root from buildMerkleTree', () => {
    const result = buildMerkleTree(['a', 'b', 'c', 'd']);
    const levels = merkleLevels(result.leaves);
    expect(levels[levels.length - 1][0]).toBe(result.root);
  });

  it('pads odd levels by duplicating the last node', () => {
    const result = buildMerkleTree(['a', 'b', 'c']);
    const levels = merkleLevels(result.leaves);
    expect(levels.map(l => l.length)).toEqual([3, 2, 1]);
    expect(levels[levels.length - 1][0]).toBe(result.root);
  });
});

describe('merkleProof', () => {
  it('produces one step per level', () => {
    const { leaves } = buildMerkleTree(['a', 'b', 'c', 'd']);
    expect(merkleProof(leaves, 0)).toHaveLength(2);
  });

  it('is empty for a single-leaf tree', () => {
    const { leaves } = buildMerkleTree(['only']);
    expect(merkleProof(leaves, 0)).toEqual([]);
  });

  it('ends at the root for every leaf', () => {
    const result = buildMerkleTree(['a', 'b', 'c', 'd', 'e']);
    for (let i = 0; i < result.leaves.length; i++) {
      const steps = merkleProof(result.leaves, i);
      expect(steps[steps.length - 1].resultHash).toBe(result.root);
    }
  });

  it('reports which side the sibling is on', () => {
    const { leaves } = buildMerkleTree(['a', 'b', 'c', 'd']);
    expect(merkleProof(leaves, 0)[0].siblingPosition).toBe('right');
    expect(merkleProof(leaves, 1)[0].siblingPosition).toBe('left');
  });

  it('flags a node paired with itself on an odd level', () => {
    const { leaves } = buildMerkleTree(['a', 'b', 'c']);
    expect(merkleProof(leaves, 2)[0].duplicated).toBe(true);
    expect(merkleProof(leaves, 0)[0].duplicated).toBe(false);
  });

  it('throws for an out-of-range leaf index', () => {
    const { leaves } = buildMerkleTree(['a', 'b']);
    expect(() => merkleProof(leaves, 5)).toThrow();
    expect(() => merkleProof(leaves, -1)).toThrow();
  });
});

describe('Merkle Tree Visualizer', () => {
  describe('buildMerkleTree', () => {
    it('throws for empty input', () => {
      expect(() => buildMerkleTree([])).toThrow();
    });

    it('throws for all-whitespace input', () => {
      expect(() => buildMerkleTree(['', '   ', ''])).toThrow();
    });

    it('builds a tree for a single item', () => {
      const result = buildMerkleTree(['hello']);
      expect(result.root).toBeDefined();
      expect(result.root.length).toBe(64); // SHA-256 hex
      expect(result.leaves.length).toBe(1);
    });

    it('root is 64-char hex string (SHA-256)', () => {
      const result = buildMerkleTree(['a', 'b', 'c', 'd']);
      expect(result.root).toMatch(/^[0-9a-f]{64}$/);
    });

    it('produces different roots for different inputs', () => {
      const r1 = buildMerkleTree(['alice', 'bob']);
      const r2 = buildMerkleTree(['carol', 'dave']);
      expect(r1.root).not.toBe(r2.root);
    });

    it('produces same root for same inputs', () => {
      const r1 = buildMerkleTree(['x', 'y', 'z']);
      const r2 = buildMerkleTree(['x', 'y', 'z']);
      expect(r1.root).toBe(r2.root);
    });

    it('leaf count matches non-empty items', () => {
      const result = buildMerkleTree(['a', 'b', 'c']);
      expect(result.leaves.length).toBe(3);
    });

    it('includes ascii tree in output', () => {
      const result = buildMerkleTree(['alpha', 'beta', 'gamma']);
      expect(result.asciiTree).toContain('Merkle Root');
    });

    it('includes proof path for first item', () => {
      const result = buildMerkleTree(['tx1', 'tx2', 'tx3', 'tx4']);
      expect(result.proofPath.length).toBeGreaterThan(0);
      expect(result.proofPath[0]).toContain('leaf');
    });

    it('proof path ends with root', () => {
      const result = buildMerkleTree(['a', 'b', 'c', 'd']);
      const last = result.proofPath[result.proofPath.length - 1];
      expect(last).toContain('root');
    });

    it('throws for more than 64 items', () => {
      const items = Array.from({ length: 65 }, (_, i) => `item${i}`);
      expect(() => buildMerkleTree(items)).toThrow();
    });

    it('handles 2-item tree', () => {
      const result = buildMerkleTree(['left', 'right']);
      expect(result.leaves.length).toBe(2);
      expect(result.root.length).toBe(64);
    });

    it('two-item root is hash of leaf pair', () => {
      // The root for 2 items should not equal either leaf hash
      const result = buildMerkleTree(['left', 'right']);
      expect(result.root).not.toBe(result.leaves[0]);
      expect(result.root).not.toBe(result.leaves[1]);
    });
  });
});
