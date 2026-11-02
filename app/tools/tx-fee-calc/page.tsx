import type { Metadata } from 'next';
import { TxFeeCalculator } from '@/Components/Functions/TxFeeCalcTools';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/tx-fee-calc', {
  title: 'Crypto gas fee calculator | Ethereum & Bitcoin | DevOven',
  description:
    'Estimate crypto gas fees for Ethereum and Bitcoin with preset example rates. Compare gas units or transaction vbytes and understand how fees are calculated.',
});

export default function Page() {
  return (
    <TxFeeCalculator
      article={
        <ToolArticle
          name="Crypto gas fee calculator"
          path="/tools/tx-fee-calc"
          description={metadata.description ?? ''}
          category="DeveloperApplication"
          sections={[
            {
              heading: 'Calculate an Ethereum gas fee',
              body: (
                <>
                  <p>
                    Select an ETH transfer, token transfer, approval, swap, or a
                    custom gas amount. The calculator multiplies gas units by a
                    preset gas price to show example fees. Its Ethereum
                    scenarios use 10, 20, 40, and 100 Gwei per gas.
                  </p>
                  <p>
                    The formula is{' '}
                    <code>
                      fee in ETH = gas used × gas price in Gwei ÷ 1,000,000,000
                    </code>
                    . For a 21,000-gas transfer at 20 Gwei, the result is
                    0.00042 ETH. See the{' '}
                    <a
                      className="underline"
                      href="https://ethereum.org/en/developers/docs/gas/"
                    >
                      Ethereum gas documentation
                    </a>{' '}
                    for how gas and transaction fees work.
                  </p>
                </>
              ),
            },
            {
              heading: 'Estimate Bitcoin fees and understand the presets',
              body: (
                <>
                  <p>
                    For Bitcoin, the calculation uses transaction size in
                    virtual bytes multiplied by a fee rate in satoshis per
                    virtual byte. A 141-vbyte transaction at 15 sat/vbyte costs
                    2,115 satoshis. Select a preset transaction type or enter a
                    custom size.
                  </p>
                  <p>
                    All rates here are fixed examples. The tool does not fetch
                    live gas prices, mempool rates, exchange prices, or
                    confirmation times. The speed labels name comparison
                    scenarios and do not guarantee when a transaction will
                    confirm. Contract gas usage also varies, so use your
                    wallet's current simulation and fee estimate before
                    submitting a transaction.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Does this crypto gas fee calculator use live prices?',
              answer:
                'No. It uses preset example rates to compare fee scenarios. Check current network rates and your wallet estimate for an actual transaction.',
            },
            {
              question: 'Why can my final Ethereum fee differ?',
              answer:
                'The final fee depends on actual gas used and the effective price per gas when the transaction executes. The calculator uses preset gas amounts and example prices.',
            },
          ]}
        />
      }
    />
  );
}
