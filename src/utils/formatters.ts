/**
 * TradeMind — Formatters
 * Utility functions for formatting currency, dates, percentages, etc.
 */

// ── Currency Formatting ──
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  showSign: boolean = true
): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  if (!showSign) return formatted;

  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return formatted;
}

/**
 * Format with compact notation for large numbers
 */
export function formatCompactCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `${amount >= 0 ? '+' : '-'}$${(Math.abs(amount) / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 10_000) {
    return `${amount >= 0 ? '+' : '-'}$${(Math.abs(amount) / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(amount, currency);
}

// ── Number Formatting ──
export function formatNumber(
  value: number,
  decimals: number = 2
): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercentage(
  value: number,
  decimals: number = 1,
  showSign: boolean = true
): string {
  const formatted = `${Math.abs(value).toFixed(decimals)}%`;
  if (!showSign) return formatted;
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

export function formatPips(pips: number, showSign: boolean = true): string {
  const formatted = `${Math.abs(pips).toFixed(1)} pips`;
  if (!showSign) return formatted;
  if (pips > 0) return `+${formatted}`;
  if (pips < 0) return `-${formatted}`;
  return formatted;
}

export function formatLotSize(lots: number): string {
  if (lots >= 1) return `${lots.toFixed(2)} lot`;
  if (lots >= 0.1) return `${lots.toFixed(2)} lot`;
  return `${lots.toFixed(2)} lot`;
}

// ── Price Formatting ──
export function formatPrice(price: number, symbol: string = ''): string {
  // Determine decimal places based on symbol
  const upperSymbol = symbol.toUpperCase();

  if (['USDJPY', 'EURJPY', 'GBPJPY', 'AUDJPY', 'CADJPY', 'NZDJPY', 'CHFJPY'].includes(upperSymbol)) {
    return price.toFixed(3);
  }
  if (['XAUUSD'].includes(upperSymbol)) {
    return price.toFixed(2);
  }
  if (['BTCUSD', 'ETHUSD'].includes(upperSymbol)) {
    return price.toFixed(2);
  }

  // Default forex: 5 decimal places
  if (price < 10) return price.toFixed(5);
  if (price < 1000) return price.toFixed(3);
  return price.toFixed(2);
}

// ── Date Formatting ──
export function formatDate(dateStr: string, format: 'short' | 'long' | 'time' | 'datetime' | 'relative' = 'short'): string {
  const date = new Date(dateStr);

  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

    case 'long':
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    case 'time':
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

    case 'datetime':
      return `${date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })} ${date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })}`;

    case 'relative':
      return getRelativeTime(date);

    default:
      return date.toLocaleDateString();
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}mo ago`;
  return `${Math.floor(diffDay / 365)}y ago`;
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ── Trade Display ──
export function formatDirection(direction: 'long' | 'short'): string {
  return direction === 'long' ? 'BUY' : 'SELL';
}

export function formatInstrument(instrument: string): string {
  const labels: Record<string, string> = {
    forex: 'Forex',
    stocks: 'Stocks',
    crypto: 'Crypto',
    futures: 'Futures',
  };
  return labels[instrument] ?? instrument;
}

export function formatRiskReward(ratio: number | null): string {
  if (ratio === null) return '—';
  return `1:${ratio.toFixed(1)}`;
}

// ── Color Helpers ──
export function getProfitLossColor(
  amount: number,
  profitColor: string,
  lossColor: string,
  neutralColor: string
): string {
  if (amount > 0) return profitColor;
  if (amount < 0) return lossColor;
  return neutralColor;
}
