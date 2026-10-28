import clsx from 'clsx';
import {
  siBinance,
  siCoinbase,
  siEthereum,
  siKucoin,
  siOkx,
  siOptimism,
  siPolygon,
  siRobinhood,
  type SimpleIcon,
} from 'simple-icons';

const CHAINS: Record<string, { mark: string; color: string; name: string; icon?: SimpleIcon }> = {
  ethereum: { mark: 'Ξ', color: '#8b9cff', name: 'Ethereum', icon: siEthereum },
  base: { mark: 'B', color: '#1768ff', name: 'Base' },
  optimism: { mark: 'OP', color: '#ff173d', name: 'Optimism', icon: siOptimism },
  arbitrum: { mark: 'A', color: '#28a0f0', name: 'Arbitrum' },
  bnb: { mark: 'BNB', color: '#f0b90b', name: 'BNB Chain', icon: siBinance },
  polygon: { mark: 'P', color: '#8247e5', name: 'Polygon', icon: siPolygon },
  robinhood: { mark: 'RH', color: '#00c805', name: 'Robinhood Chain', icon: siRobinhood },
};

const EXCHANGES: { pattern: RegExp; mark: string; color: string; icon?: SimpleIcon }[] = [
  { pattern: /binance/i, mark: 'BN', color: '#f0b90b', icon: siBinance },
  { pattern: /coinbase/i, mark: 'C', color: '#1652f0', icon: siCoinbase },
  { pattern: /okx|okex/i, mark: 'OKX', color: '#f4f4f5', icon: siOkx },
  { pattern: /kucoin/i, mark: 'K', color: '#24ae8f', icon: siKucoin },
  { pattern: /kraken/i, mark: 'K', color: '#5741d9' },
  { pattern: /bybit/i, mark: 'BY', color: '#f7a600' },
  { pattern: /crypto\.com/i, mark: 'CRO', color: '#173f8f' },
  { pattern: /bitfinex/i, mark: 'BF', color: '#16b157' },
  { pattern: /gemini/i, mark: 'G', color: '#4d79ff' },
  { pattern: /bitstamp/i, mark: 'BS', color: '#54b38e' },
];

function IconShape({ icon, className }: { icon: SimpleIcon; className?: string }) {
  return (
    <svg aria-hidden='true' className={className} viewBox='0 0 24 24' role='img'>
      <path d={icon.path} fill='currentColor' />
    </svg>
  );
}

export function ChainMark({ chain, className }: { chain?: string; className?: string }) {
  const config = CHAINS[chain ?? 'ethereum'] ?? { mark: chain?.slice(0, 2).toUpperCase() ?? '?', color: '#9290a9', name: chain ?? 'Unknown chain' };
  return (
    <span
      title={config.name}
      aria-label={config.name}
      className={clsx('inline-grid flex-none place-items-center rounded-full font-display font-bold leading-none', className)}
      style={{ background: config.icon ? 'rgba(255,255,255,.92)' : config.color, color: config.icon ? `#${config.icon.hex}` : '#fff' }}
    >
      {config.icon ? <IconShape icon={config.icon} className='h-[72%] w-[72%]' /> : config.mark}
    </span>
  );
}

export function ExchangeMark({ label }: { label?: string }) {
  const config: { mark: string; color: string; icon?: SimpleIcon } =
    EXCHANGES.find((exchange) => exchange.pattern.test(label ?? '')) ?? { mark: 'CEX', color: '#7062e9' };
  return (
    <span
      title={label ?? 'Exchange'}
      aria-label={`${label ?? 'Exchange'} logo`}
      className='grid h-8 w-8 place-items-center rounded-lg border border-white/15 font-display text-[9px] font-black tracking-[-.04em]'
      style={{ background: config.icon ? 'rgba(255,255,255,.92)' : config.color, color: config.icon ? `#${config.icon.hex}` : '#fff' }}
    >
      {config.icon ? <IconShape icon={config.icon} className='h-[21px] w-[21px]' /> : config.mark}
    </span>
  );
}
