// Transaction Fee Calculator — pure logic, no browser APIs

export type TxType =
  | 'eth-transfer'
  | 'erc20-transfer'
  | 'erc20-approve'
  | 'uniswap-swap'
  | 'btc-p2pkh'
  | 'btc-p2wpkh'
  | 'btc-p2sh'
  | 'custom-eth'
  | 'custom-btc';

export interface TxTypeInfo {
  id: TxType;
  name: string;
  chain: 'ETH' | 'BTC';
  gasOrVbytes: number;
  description: string;
}

export const TX_TYPES: TxTypeInfo[] = [
  {
    id: 'eth-transfer',
    name: 'Simple ETH Transfer',
    chain: 'ETH',
    gasOrVbytes: 21000,
    description: 'Basic ETH send between two accounts',
  },
  {
    id: 'erc20-transfer',
    name: 'ERC-20 Token Transfer',
    chain: 'ETH',
    gasOrVbytes: 65000,
    description: 'Transfer ERC-20 tokens (e.g. USDC, DAI)',
  },
  {
    id: 'erc20-approve',
    name: 'ERC-20 Approve',
    chain: 'ETH',
    gasOrVbytes: 46000,
    description: 'Approve a spender to use ERC-20 tokens',
  },
  {
    id: 'uniswap-swap',
    name: 'Uniswap V3 Swap',
    chain: 'ETH',
    gasOrVbytes: 150000,
    description: 'Single-hop swap on Uniswap V3',
  },
  {
    id: 'btc-p2pkh',
    name: 'Bitcoin P2PKH (Legacy)',
    chain: 'BTC',
    gasOrVbytes: 226,
    description: 'Legacy 1-in 2-out P2PKH transaction',
  },
  {
    id: 'btc-p2wpkh',
    name: 'Bitcoin P2WPKH (SegWit)',
    chain: 'BTC',
    gasOrVbytes: 141,
    description: 'Native SegWit 1-in 2-out P2WPKH transaction',
  },
  {
    id: 'btc-p2sh',
    name: 'Bitcoin P2SH',
    chain: 'BTC',
    gasOrVbytes: 296,
    description: 'Pay-to-Script-Hash transaction',
  },
  {
    id: 'custom-eth',
    name: 'Custom (Gas)',
    chain: 'ETH',
    gasOrVbytes: 0,
    description: 'Enter a custom gas limit',
  },
  {
    id: 'custom-btc',
    name: 'Custom (vBytes)',
    chain: 'BTC',
    gasOrVbytes: 0,
    description: 'Enter a custom transaction size in vbytes',
  },
];

export interface FeeRow {
  speed: string;
  rate: string;
  fee: string;
  feeUsd?: string;
}

export interface FeeResult {
  chain: 'ETH' | 'BTC';
  txName: string;
  sizeLabel: string;
  rows: FeeRow[];
}

// ETH gas prices (Gwei) for slow/standard/fast/rapid
const ETH_GAS_PRICES = [
  { speed: 'Slow', gwei: 10 },
  { speed: 'Standard', gwei: 20 },
  { speed: 'Fast', gwei: 40 },
  { speed: 'Rapid', gwei: 100 },
];

// BTC sat/vbyte rates
const BTC_FEE_RATES = [
  { speed: 'Low Priority', satPerVbyte: 5 },
  { speed: 'Standard', satPerVbyte: 15 },
  { speed: 'Fast', satPerVbyte: 30 },
  { speed: 'ASAP', satPerVbyte: 80 },
];

function formatEth(wei: number): string {
  // wei -> ETH
  const eth = wei / 1e18;
  if (eth < 0.0001) return `${(eth * 1e6).toFixed(4)} μETH`;
  return `${eth.toFixed(6)} ETH`;
}

function formatGwei(gwei: number): string {
  return `${gwei} Gwei`;
}

function formatSats(sats: number): string {
  if (sats >= 100000) return `${(sats / 100000000).toFixed(6)} BTC`;
  return `${sats.toLocaleString()} sats`;
}

export function calculateFees(txTypeId: TxType, customSize: number): FeeResult {
  const txType = TX_TYPES.find(t => t.id === txTypeId);
  if (!txType) throw new Error('Unknown tx type');

  const size = txTypeId === 'custom-eth' || txTypeId === 'custom-btc'
    ? customSize
    : txType.gasOrVbytes;

  if (txType.chain === 'ETH') {
    const rows: FeeRow[] = ETH_GAS_PRICES.map(({ speed, gwei }) => {
      const feeGwei = size * gwei;
      const feeWei = feeGwei * 1e9;
      return {
        speed,
        rate: formatGwei(gwei),
        fee: formatEth(feeWei),
      };
    });
    return {
      chain: 'ETH',
      txName: txType.name,
      sizeLabel: `${size.toLocaleString()} gas`,
      rows,
    };
  } else {
    const rows: FeeRow[] = BTC_FEE_RATES.map(({ speed, satPerVbyte }) => {
      const feeSats = size * satPerVbyte;
      return {
        speed,
        rate: `${satPerVbyte} sat/vbyte`,
        fee: formatSats(feeSats),
      };
    });
    return {
      chain: 'BTC',
      txName: txType.name,
      sizeLabel: `${size} vbytes`,
      rows,
    };
  }
}

export function formatFeeResult(result: FeeResult): string {
  const header = [
    `Transaction: ${result.txName}`,
    `Size:        ${result.sizeLabel}`,
    ``,
    `Speed            Rate              Estimated Fee`,
    `─────────────────────────────────────────────────`,
  ];

  const tableRows = result.rows.map(r =>
    `${r.speed.padEnd(17)}${r.rate.padEnd(18)}${r.fee}`
  );

  return [...header, ...tableRows].join('\n');
}
