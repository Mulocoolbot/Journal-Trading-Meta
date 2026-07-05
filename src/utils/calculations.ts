/**
 * TradeMind — Trading Calculations
 * Utility functions for P&L, pip, lot size, and risk calculations
 */

import type { Trade, Instrument, TradeDirection, TradeStats, DailyStats } from '@/src/types/trade';

// ── Pip Value Constants ──
const PIP_SIZES: Record<string, number> = {
  // JPY pairs have 0.01 pip size
  USDJPY: 0.01, EURJPY: 0.01, GBPJPY: 0.01, AUDJPY: 0.01,
  CADJPY: 0.01, NZDJPY: 0.01, CHFJPY: 0.01,
  // All others have 0.0001 pip size
  DEFAULT: 0.0001,
  // Gold & Silver
  XAUUSD: 0.01,
  XAGUSD: 0.001,
  // Crypto (varies, default to 0.01 for most)
  BTCUSD: 0.01,
  ETHUSD: 0.01,
};

/**
 * Get pip size for a symbol
 */
export function getPipSize(symbol: string): number {
  return PIP_SIZES[symbol.toUpperCase()] ?? PIP_SIZES.DEFAULT;
}

/**
 * Calculate profit/loss in pips
 */
export function calculatePips(
  entryPrice: number,
  exitPrice: number,
  direction: TradeDirection,
  symbol: string
): number {
  const pipSize = getPipSize(symbol);
  const diff = direction === 'long'
    ? exitPrice - entryPrice
    : entryPrice - exitPrice;
  return Math.round((diff / pipSize) * 10) / 10; // 1 decimal
}

/**
 * Calculate profit/loss in account currency
 * Simplified calculation — in production, would need exchange rates
 */
export function calculateProfitLoss(
  entryPrice: number,
  exitPrice: number,
  direction: TradeDirection,
  lotSize: number,
  symbol: string,
  instrument: Instrument,
  commission: number = 0,
  swap: number = 0
): number {
  let rawPL: number;

  if (instrument === 'forex') {
    const pips = calculatePips(entryPrice, exitPrice, direction, symbol);
    const pipSize = getPipSize(symbol);
    const contractSize = 100000; // Standard lot
    rawPL = pips * pipSize * lotSize * contractSize;

    // For JPY pairs, adjust
    if (pipSize === 0.01) {
      rawPL = pips * lotSize * 1000; // Simplified
    } else {
      rawPL = pips * lotSize * 10; // Standard pip value ~$10/lot
    }
  } else if (instrument === 'crypto') {
    const diff = direction === 'long'
      ? exitPrice - entryPrice
      : entryPrice - exitPrice;
    rawPL = diff * lotSize;
  } else if (instrument === 'stocks') {
    const diff = direction === 'long'
      ? exitPrice - entryPrice
      : entryPrice - exitPrice;
    rawPL = diff * lotSize; // lotSize = shares
  } else {
    // Futures — simplified
    const diff = direction === 'long'
      ? exitPrice - entryPrice
      : entryPrice - exitPrice;
    rawPL = diff * lotSize;
  }

  return Math.round((rawPL - commission + swap) * 100) / 100;
}

/**
 * Calculate Risk/Reward Ratio
 */
export function calculateRiskReward(
  entryPrice: number,
  stopLoss: number | null,
  takeProfit: number | null,
  direction: TradeDirection
): number | null {
  if (!stopLoss || !takeProfit) return null;

  let risk: number;
  let reward: number;

  if (direction === 'long') {
    risk = entryPrice - stopLoss;
    reward = takeProfit - entryPrice;
  } else {
    risk = stopLoss - entryPrice;
    reward = entryPrice - takeProfit;
  }

  if (risk <= 0) return null;

  return Math.round((reward / risk) * 100) / 100;
}

/**
 * Calculate position size based on risk percentage
 */
export function calculatePositionSize(
  accountBalance: number,
  riskPercentage: number,
  entryPrice: number,
  stopLoss: number,
  symbol: string,
  instrument: Instrument
): number {
  const riskAmount = accountBalance * (riskPercentage / 100);
  const stopDistance = Math.abs(entryPrice - stopLoss);

  if (stopDistance === 0) return 0;

  if (instrument === 'forex') {
    const pipSize = getPipSize(symbol);
    const stopPips = stopDistance / pipSize;
    const pipValue = 10; // Approximate for standard lot
    const lots = riskAmount / (stopPips * pipValue);
    return Math.round(lots * 100) / 100; // Round to 0.01 lot
  }

  // For stocks/crypto/futures — simplified
  const shares = riskAmount / stopDistance;
  return Math.round(shares * 100) / 100;
}

/**
 * Calculate comprehensive trade statistics from an array of closed trades
 */
export function calculateTradeStats(trades: Trade[]): TradeStats {
  const closedTrades = trades.filter(
    (t) => t.status === 'closed' && t.profitLoss !== null
  );

  if (closedTrades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      winRate: 0,
      totalProfitLoss: 0,
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      profitFactor: 0,
      averageRiskReward: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      sharpeRatio: null,
      expectancy: 0,
    };
  }

  const wins = closedTrades.filter((t) => (t.profitLoss ?? 0) > 0);
  const losses = closedTrades.filter((t) => (t.profitLoss ?? 0) < 0);
  const breakEven = closedTrades.filter((t) => (t.profitLoss ?? 0) === 0);

  const totalPL = closedTrades.reduce((sum, t) => sum + (t.profitLoss ?? 0), 0);
  const totalWins = wins.reduce((sum, t) => sum + (t.profitLoss ?? 0), 0);
  const totalLosses = Math.abs(losses.reduce((sum, t) => sum + (t.profitLoss ?? 0), 0));

  const averageWin = wins.length > 0 ? totalWins / wins.length : 0;
  const averageLoss = losses.length > 0 ? totalLosses / losses.length : 0;

  // Consecutive wins/losses
  let maxConsWins = 0, maxConsLosses = 0;
  let currentConsWins = 0, currentConsLosses = 0;
  for (const t of closedTrades) {
    if ((t.profitLoss ?? 0) > 0) {
      currentConsWins++;
      currentConsLosses = 0;
      maxConsWins = Math.max(maxConsWins, currentConsWins);
    } else if ((t.profitLoss ?? 0) < 0) {
      currentConsLosses++;
      currentConsWins = 0;
      maxConsLosses = Math.max(maxConsLosses, currentConsLosses);
    } else {
      currentConsWins = 0;
      currentConsLosses = 0;
    }
  }

  // Max drawdown
  let peak = 0;
  let cumPL = 0;
  let maxDD = 0;
  let maxDDPercent = 0;
  for (const t of closedTrades) {
    cumPL += t.profitLoss ?? 0;
    if (cumPL > peak) peak = cumPL;
    const dd = peak - cumPL;
    if (dd > maxDD) {
      maxDD = dd;
      maxDDPercent = peak > 0 ? (dd / peak) * 100 : 0;
    }
  }

  // Average RR
  const tradesWithRR = closedTrades.filter((t) => t.riskRewardRatio !== null);
  const avgRR = tradesWithRR.length > 0
    ? tradesWithRR.reduce((sum, t) => sum + (t.riskRewardRatio ?? 0), 0) / tradesWithRR.length
    : 0;

  // Expectancy = (Win% × Avg Win) - (Loss% × Avg Loss)
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
  const lossRate = closedTrades.length > 0 ? (losses.length / closedTrades.length) * 100 : 0;
  const expectancy = (winRate / 100 * averageWin) - (lossRate / 100 * averageLoss);

  return {
    totalTrades: closedTrades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    breakEvenTrades: breakEven.length,
    winRate: Math.round(winRate * 100) / 100,
    totalProfitLoss: Math.round(totalPL * 100) / 100,
    averageWin: Math.round(averageWin * 100) / 100,
    averageLoss: Math.round(averageLoss * 100) / 100,
    largestWin: wins.length > 0 ? Math.max(...wins.map((t) => t.profitLoss ?? 0)) : 0,
    largestLoss: losses.length > 0 ? Math.min(...losses.map((t) => t.profitLoss ?? 0)) : 0,
    profitFactor: totalLosses > 0 ? Math.round((totalWins / totalLosses) * 100) / 100 : totalWins > 0 ? Infinity : 0,
    averageRiskReward: Math.round(avgRR * 100) / 100,
    maxConsecutiveWins: maxConsWins,
    maxConsecutiveLosses: maxConsLosses,
    maxDrawdown: Math.round(maxDD * 100) / 100,
    maxDrawdownPercent: Math.round(maxDDPercent * 100) / 100,
    sharpeRatio: null, // Would need risk-free rate and more data
    expectancy: Math.round(expectancy * 100) / 100,
  };
}

/**
 * Calculate daily statistics from trades
 */
export function calculateDailyStats(trades: Trade[]): DailyStats[] {
  const byDate = new Map<string, Trade[]>();

  for (const trade of trades) {
    const dateKey = trade.exitDate
      ? trade.exitDate.split('T')[0]
      : trade.entryDate.split('T')[0];
    const existing = byDate.get(dateKey) ?? [];
    existing.push(trade);
    byDate.set(dateKey, existing);
  }

  const stats: DailyStats[] = [];
  for (const [date, dayTrades] of byDate) {
    const closed = dayTrades.filter((t) => t.status === 'closed');
    const totalPL = closed.reduce((sum, t) => sum + (t.profitLoss ?? 0), 0);
    const wins = closed.filter((t) => (t.profitLoss ?? 0) > 0);
    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;

    // Average emotion for the day
    const emotions = dayTrades
      .map((t) => t.emotionEntry)
      .filter((e) => e !== null) as number[];
    const avgEmotion = emotions.length > 0
      ? Math.round(emotions.reduce((a, b) => a + b, 0) / emotions.length) as 1 | 2 | 3 | 4 | 5
      : null;

    stats.push({
      date,
      trades: dayTrades.length,
      profitLoss: Math.round(totalPL * 100) / 100,
      winRate: Math.round(winRate * 100) / 100,
      emotion: avgEmotion,
    });
  }

  return stats.sort((a, b) => a.date.localeCompare(b.date));
}
