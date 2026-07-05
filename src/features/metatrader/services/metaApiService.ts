/**
 * TradeMind — MetaApi Service
 * Handles MT4/MT5 integration via MetaApi REST API
 * Token is loaded from environment variables, NEVER hardcoded.
 */

const METAAPI_BASE_URL = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';
const METAAPI_CLIENT_URL = 'https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * Get MetaApi token from environment variables
 * In production, this should be accessed via a backend proxy for extra security
 */
function getToken(): string {
  const token = process.env.EXPO_PUBLIC_METAAPI_TOKEN;
  if (!token) {
    throw new Error(
      'MetaApi token not found. Set EXPO_PUBLIC_METAAPI_TOKEN in .env file.'
    );
  }
  return token;
}

function generateTransactionId(): string {
  let id = '';
  const chars = 'abcdef0123456789';
  for (let i = 0; i < 32; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Base fetch wrapper with auth headers
 */
async function metaApiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'auth-token': token,
  };

  const method = options.method?.toUpperCase() || 'GET';
  if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
    headers['transaction-id'] = generateTransactionId();
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `MetaApi Error [${response.status}]: ${errorBody}`
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ── Types ──

export interface MetaApiAccount {
  _id: string;
  name: string;
  type: string;
  login: string;
  server: string;
  platform: 'mt4' | 'mt5';
  state: string;
  connectionStatus: string;
  baseCurrency: string;
}

export interface MetaApiAccountInfo {
  broker: string;
  currency: string;
  server: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
  name: string;
  login: number;
  platform: string;
}

export interface MetaApiDeal {
  id: string;
  type: 'DEAL_TYPE_BUY' | 'DEAL_TYPE_SELL' | 'DEAL_TYPE_BALANCE' | string;
  entryType: 'DEAL_ENTRY_IN' | 'DEAL_ENTRY_OUT' | 'DEAL_ENTRY_INOUT' | string;
  symbol: string;
  volume: number;
  price: number;
  profit: number;
  commission: number;
  swap: number;
  time: string; // ISO date
  comment: string;
  brokerComment: string;
  platform: string;
}

export interface MetaApiPosition {
  id: string;
  type: 'POSITION_TYPE_BUY' | 'POSITION_TYPE_SELL';
  symbol: string;
  volume: number;
  openPrice: number;
  currentPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  profit: number;
  swap: number;
  commission: number;
  time: string;
  comment: string;
}

// ── API Methods ──

/**
 * List all provisioned MetaApi accounts
 */
export async function listAccounts(): Promise<MetaApiAccount[]> {
  return metaApiFetch<MetaApiAccount[]>(
    `${METAAPI_BASE_URL}/users/current/accounts`
  );
}

/**
 * Get account information (balance, equity, etc.)
 */
export async function getAccountInfo(
  accountId: string
): Promise<MetaApiAccountInfo> {
  return metaApiFetch<MetaApiAccountInfo>(
    `${METAAPI_CLIENT_URL}/users/current/accounts/${accountId}/account-information`
  );
}

/**
 * Get deal history (closed trades)
 * @param startTime ISO date string for start of period
 * @param endTime ISO date string for end of period
 */
export async function getDealHistory(
  accountId: string,
  startTime: string,
  endTime: string
): Promise<MetaApiDeal[]> {
  const params = new URLSearchParams({
    startTime,
    endTime,
  });

  const result = await metaApiFetch<{ deals: MetaApiDeal[] }>(
    `${METAAPI_CLIENT_URL}/users/current/accounts/${accountId}/history-deals/time?${params}`
  );

  return result.deals ?? [];
}

/**
 * Get open positions
 */
export async function getOpenPositions(
  accountId: string
): Promise<MetaApiPosition[]> {
  return metaApiFetch<MetaApiPosition[]>(
    `${METAAPI_CLIENT_URL}/users/current/accounts/${accountId}/positions`
  );
}

/**
 * Deploy/undeploy account (required before accessing trade data)
 */
export async function deployAccount(accountId: string): Promise<void> {
  await metaApiFetch(
    `${METAAPI_BASE_URL}/users/current/accounts/${accountId}/deploy`,
    { method: 'POST' }
  );
}

export async function undeployAccount(accountId: string): Promise<void> {
  await metaApiFetch(
    `${METAAPI_BASE_URL}/users/current/accounts/${accountId}/undeploy`,
    { method: 'POST' }
  );
}

export async function deleteAccount(accountId: string): Promise<void> {
  await metaApiFetch(
    `${METAAPI_BASE_URL}/users/current/accounts/${accountId}`,
    { method: 'DELETE' }
  );
}

/**
 * Test connection — verify token is valid by listing accounts
 */
export async function testConnection(): Promise<{
  success: boolean;
  accountCount: number;
  error?: string;
}> {
  try {
    const accounts = await listAccounts();
    return {
      success: true,
      accountCount: accounts.length,
    };
  } catch (error) {
    return {
      success: false,
      accountCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Convert MetaApi deal to our Trade format
 */
export function mapDealToTrade(
  deal: MetaApiDeal,
  accountId: string,
  platform: 'mt4' | 'mt5'
) {
  // Determine instrument type from symbol
  const instrument = guessInstrument(deal.symbol);

  return {
    instrument,
    symbol: deal.symbol,
    direction: deal.type === 'DEAL_TYPE_BUY' ? 'long' as const : 'short' as const,
    entryPrice: deal.price,
    exitPrice: null as number | null,
    stopLoss: null as number | null,
    takeProfit: null as number | null,
    lotSize: deal.volume,
    leverage: null as number | null,
    commission: deal.commission,
    swap: deal.swap,
    profitLoss: deal.profit,
    profitLossPips: null as number | null,
    riskRewardRatio: null as number | null,
    strategy: '',
    timeframe: 'H1' as const,
    entryDate: deal.time,
    exitDate: null as string | null,
    status: 'closed' as const,
    screenshots: [] as string[],
    notes: deal.comment || '',
    tags: [] as string[],
    emotionEntry: null,
    emotionExit: null,
    source: platform as 'mt4' | 'mt5',
    externalId: deal.id,
    accountId,
  };
}

/**
 * Guess instrument type from symbol name
 */
function guessInstrument(symbol: string): 'forex' | 'stocks' | 'crypto' | 'futures' {
  const upper = symbol.toUpperCase();

  // Crypto
  if (['BTC', 'ETH', 'BNB', 'XRP', 'SOL', 'ADA', 'DOT', 'DOGE'].some(c => upper.includes(c))) {
    return 'crypto';
  }

  // Indices / Futures
  if (['US30', 'US500', 'NAS', 'DAX', 'FTSE', 'JP225', 'OIL', 'GAS', 'USOIL', 'UKOIL'].some(f => upper.includes(f))) {
    return 'futures';
  }

  // Default to forex (including metals like XAUUSD, XAGUSD)
  return 'forex';
}

/**
 * Provision (register) a new MetaTrader account programmatically on MetaApi
 */
export interface ProvisionAccountData {
  name: string;
  login: string;
  password: string;
  server: string;
  platform: 'mt4' | 'mt5';
  baseCurrency: string;
}

export async function provisionAccount(
  data: ProvisionAccountData
): Promise<MetaApiAccount> {
  return metaApiFetch<MetaApiAccount>(
    `${METAAPI_BASE_URL}/users/current/accounts`,
    {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        type: 'cloud-g1',
        reliability: 'regular',
        login: data.login,
        password: data.password,
        server: data.server,
        platform: data.platform,
        magic: 0,
        baseCurrency: data.baseCurrency,
      }),
    }
  );
}
