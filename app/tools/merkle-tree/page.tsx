import type { Metadata } from 'next';
import { MerkleTreeVisualizer } from '@/Components/Functions/MerkleTreeTools';

export const metadata: Metadata = {
  title: 'Merkle Tree Visualizer | DevOven',
  description: 'Build and visualize a Merkle tree from a list of items. Shows SHA-256 leaf hashes, intermediate node hashes, root hash, and proof path for the first item.',
};

const page = () => <MerkleTreeVisualizer />;
export default page;
