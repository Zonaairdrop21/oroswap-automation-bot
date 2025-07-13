import dotenv from 'dotenv';
import { createInterface } from 'node:readline';
import { readFile } from 'node:fs/promises'; // Import readFile for file operations

import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import pkg from '@cosmjs/stargate';
const { GasPrice, coins } = pkg;
import pkg2 from '@cosmjs/proto-signing';
const { DirectSecp256k1HdWallet, DirectSecp256k1Wallet } = pkg2;
import pkg_tendermintRpc from '@cosmjs/tendermint-rpc'; // Corrected import for CommonJS module
const { HttpBatchClient, JsonRpcClient } = pkg_tendermintRpc; // Destructure from default export
import { SocksProxyAgent } from 'socks-proxy-agent';

dotenv.config();

// ANSI escape codes for colors, extended to match colorama more closely
const colors = {
  reset: '\x1b[0m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m', // Corresponds to Fore.GREEN + Style.BRIGHT
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m', // Corresponds to Fore.WHITE + Style.BRIGHT
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
};

// Function to clear the console (similar to clear_console in Python)
const clear_console = () => {
  process.stdout.write('\x1B[2J\x1B[0f');
};

// Custom logging function similar to log_message in Python
const log_message = (msg) => {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
  console.log(`${colors.brightBlack}[${timestamp}]${colors.reset} ${msg}`);
};

const logger = {
  info: (msg) => log_message(`${colors.green}[✓] ${msg}${colors.reset}`),
  warn: (msg) => log_message(`${colors.yellow}[!] ${msg}${colors.reset}`),
  error: (msg) => log_message(`${colors.red}[✗] ${msg}${colors.reset}`),
  success: (msg) => log_message(`${colors.green}[+] ${msg}${colors.reset}`),
  loading: (msg) => log_message(`${colors.cyan}[⟳] ${msg}${colors.reset}`),
  step: (msg) => log_message(`${colors.white}[➤] ${msg}${colors.reset}`),
  swap: (msg) => log_message(`${colors.cyan}[↪️] ${msg}${colors.reset}`),
  swapSuccess: (msg) => log_message(`${colors.green}[✅] ${msg}${colors.reset}`),
  liquidity: (msg) => log_message(`${colors.cyan}[↪️] ${msg}${colors.reset}`),
  liquiditySuccess: (msg) => log_message(`${colors.green}[✅] ${msg}${colors.reset}`),
};

// New display_welcome_screen function for ASCII art banner
const display_welcome_screen = async () => {
    clear_console();
    const now = new Date();
    // Format date as DD.MM.YY
    const date_str = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '.');
    // Format time as HH:MM:SS
    const time_str = now.toLocaleTimeString('en-US', { hour12: false });

    console.log(`${colors.brightGreen}${colors.bold}`);
    console.log("  ┌─────────────────────────────────┐");
    console.log("  │     [ O R O S W A P ]      │");
    console.log(`  │                                 │`);
    console.log(`  │     ${colors.yellow}${time_str} ${date_str}${colors.brightGreen}      │`);
    console.log("  │                                 │");
    console.log("  │   Automated Protocol Utility    │");
    console.log(`  │ ${colors.brightWhite}   by ZonaAirdrop ${colors.brightGreen}(@ZonaAirdr0p)${colors.reset} │`);
    console.log("  └─────────────────────────────────┘\n");
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate time.sleep(1)
};


const RPC_URL = 'https://rpc.zigscan.net/';
const API_URL = 'https://testnet-api.oroswap.org/api/'; // Ensure trailing slash
const EXPLORER_URL = 'https://zigscan.org/tx/';
const GAS_PRICE = GasPrice.fromString('0.027uzig');

// Only token aktif: ZIG, ORO, NFA, CULTCOIN
const TOKEN_SYMBOLS = {
  'uzig': 'ZIG',
  'coin.zig10rfjm85jmzfhravjwpq3hcdz8ngxg7lxd0drkr.uoro': 'ORO',
  'coin.zig1qaf4dvjt5f8naam2mzpmysjm5e8sp2yhrzex8d.nfa': 'NFA',
  'coin.zig12jgpgq5ec88nwzkkjx7jyrzrljpph5pnags8sn.ucultcoin': 'CULTCOIN',
};
const TOKEN_PAIRS = {
  'ORO/ZIG': {
    contract: 'zig15jqg0hmp9n06q0as7uk3x9xkwr9k3r7yh4ww2uc0hek8zlryrgmsamk4qg',
    token1: 'coin.zig10rfjm85jmzfhravjwpq3hcdz8ngxg7lxd0drkr.uoro',
    token2: 'uzig'
  },
  'NFA/ZIG': {
    contract: 'zig1dye3zfsn83jmnxqdplkfmelyszhkve9ae6jfxf5mzgqnuylr0sdq8ng9tv',
    token1: 'coin.zig1qaf4dvjt5f8naam2mzpmysjm5e8sp2yhrzex8d.nfa',
    token2: 'uzig'
  },
  'CULTCOIN/ZIG': {
    contract: 'zig1j55nw46crxkm03fjdf3cqx3py5cd32jny685x9c3gftfdt2xlvjs63znce',
    token1: 'coin.zig12jgpgq5ec88nwzkkjx7jyrzrljpph5pnags8sn.ucultcoin',
    token2: 'uzig'
  }
};
// Token decimals
const TOKEN_DECIMALS = {
  'uzig': 6,
  'coin.zig10rfjm85jmzfhravjwpq3hcdz8ngxg7lxd0drkr.uoro': 6,
  'coin.zig1qaf4dvjt5f8naam2mzpmysjm5e8sp2yhrzex8d.nfa': 6,
  'coin.zig12jgpgq5ec88nwzkkjx7jyrzrljpph5pnags8sn.ucultcoin': 6,
};
// ONLY swap ke: ORO, NFA, CULTCOIN
const SWAP_SEQUENCE = [
  { from: 'uzig', to: 'coin.zig10rfjm85jmzfhravjwpq3hcdz8ngxg7lxd0drkr.uoro', pair: 'ORO/ZIG' },
  { from: 'uzig', to: 'coin.zig1qaf4dvjt5f8naam2mzpmysjm5e8sp2yhrzex8d.nfa', pair: 'NFA/ZIG' },
  { from: 'uzig', to: 'coin.zig12jgpgq5ec88nwzkkjx7jyrzrljpph5pnags8sn.ucultcoin', pair: 'CULTCOIN/ZIG' },
];
// ONLY liquidity ke: ORO/ZIG, NFA/ZIG, CULTCOIN/ZIG
const LIQUIDITY_PAIRS = [
  'ORO/ZIG',
  'NFA/ZIG',
  'CULTCOIN/ZIG'
];
// --- Proxy Related Global Variables ---
let proxyList = [];
let currentProxyIndex = 0;
let useProxy = false;
let removeFailedProxy = false; // New global variable to control removing failed proxies
// ------------------------------------

function getRandomMaxSpread() {
  const min = 0.005;
  const max = 0.007;
  return (Math.random() * (max - min) + min).toFixed(3);
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function isValidNumber(input) {
  const num = parseInt(input);
  return !isNaN(num) && num > 0;
}

function toMicroUnits(amount, denom) {
  const decimals = TOKEN_DECIMALS[denom] || 6;
  return Math.floor(parseFloat(amount) * Math.pow(10, decimals));
}

function isMnemonic(input) {
  const words = input.trim().split(/\s+/);
  return words.length >= 12 && words.length <= 24 && words.every(word => /^[a-z]+$/.test(word));
}

async function getWallet(key) {
  if (isMnemonic(key)) {
    return await DirectSecp256k1HdWallet.fromMnemonic(key, { prefix: 'zig' });
  } else if (/^[0-9a-fA-F]{64}$/.test(key.trim())) {
    return await DirectSecp256k1Wallet.fromKey(Buffer.from(key.trim(), 'hex'), 'zig');
  }
  throw new Error('Invalid mnemonic/private key');
}

async function getAccountAddress(wallet) {
  const [account] = await wallet.getAccounts();
  return account.address;
}

function getRandomSwapAmount() {
  const min = 0.0041;
  const max = 0.0052;
  return Math.random() * (max - min) + min;
}

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to read proxies from proxy.txt
async function loadProxiesFromFile() {
  try {
    const data = await readFile('proxy.txt', 'utf8');
    const proxies = data.split('\n')
                      .map(line => line.trim())
                      .filter(line => line.length > 0 && !line.startsWith('#')); // Filter out empty lines and comments
    if (proxies.length > 0) {
      logger.info(`Loaded ${proxies.length} proxies from proxy.txt`);
      return proxies;
    } else {
      logger.warn('proxy.txt is empty or contains no valid proxies.');
      return [];
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.warn('proxy.txt not found. Please create it if you intend to use proxies.');
    } else {
      logger.error(`Error reading proxy.txt: ${error.message}`);
    }
    return [];
  }
}

// Function to get the next proxy from the list and handle rotation/removal
const getNextProxy = () => {
    if (proxyList.length === 0) {
        return null;
    }
    const proxy = proxyList[currentProxyIndex];
    currentProxyIndex = (currentProxyIndex + 1) % proxyList.length;
    return proxy;
};

// Function to get a cosmjs client, with optional proxy support
async function getConnectedClient(wallet) {
    const options = { gasPrice: GAS_PRICE };

    if (useProxy && proxyList.length > 0) {
        let attempts = 0;
        const initialProxyCount = proxyList.length; // Number of proxies at the start of connection attempt

        while (attempts < initialProxyCount) { // Try each proxy at most once based on initial list
            const proxyUrl = getNextProxy();
            if (!proxyUrl) {
                logger.warn('No more proxies to try. Attempting connection without proxy.');
                return await SigningCosmWasmClient.connectWithSigner(RPC_URL, wallet, options);
            }

            logger.info(`Attempting connection with proxy: ${proxyUrl}`);
            try {
                const agent = new SocksProxyAgent(proxyUrl);
                const httpBatchClient = new HttpBatchClient(RPC_URL, { agent: agent });
                const jsonRpcClient = new JsonRpcClient(RPC_URL, httpBatchClient);
                return new SigningCosmWasmClient(jsonRpcClient, wallet, options);
            } catch (e) {
                logger.error(`Failed to connect with proxy ${proxyUrl}: ${e.message}`);
                if (removeFailedProxy) {
                    const failedIndex = proxyList.indexOf(proxyUrl);
                    if (failedIndex > -1) {
                        proxyList.splice(failedIndex, 1); // Remove the failed proxy
                        logger.warn(`Proxy ${proxyUrl} removed from list due to failure.`);
                        // Adjust currentProxyIndex if the removed proxy was before it
                        if (failedIndex < currentProxyIndex) {
                            currentProxyIndex--;
                        }
                    }
                }
                attempts++;
            }
        }
        // If all proxies failed, or if proxyList became empty during attempts
        logger.error('All configured proxies failed to connect. Attempting connection without proxy.');
    }
    // Default connection without proxy if useProxy is false or proxyList is empty or all proxies failed
    return await SigningCosmWasmClient.connectWithSigner(RPC_URL, wallet, options);
}

// Function to get a read-only client (e.g., for balance checks, pool info)
async function getReadOnlyClient() {
    return await SigningCosmWasmClient.connect(RPC_URL);
}


async function getPoolInfo(contractAddress) {
  try {
    const client = await getReadOnlyClient();
    const poolInfo = await client.queryContractSmart(contractAddress, { pool: {} });
    return poolInfo;
  } catch (error) {
    logger.error(`Failed to get pool info: ${error.message}`);
    return null;
  }
}

async function canSwap(pairName, fromDenom, amount) {
  const pair = TOKEN_PAIRS[pairName];
  const poolInfo = await getPoolInfo(pair.contract);
  if (!poolInfo) {
    logger.warn(`[!] Tidak bisa cek pool info untuk ${pairName}, swap di-skip.`);
    return false;
  }
  const asset = poolInfo.assets.find(a => a.info.native_token?.denom === fromDenom);
  const poolBalance = asset ? parseFloat(asset.amount) / Math.pow(10, TOKEN_DECIMALS[fromDenom]) : 0;
  if (poolBalance <= 10 * amount) { // Arbitrary threshold
    logger.warn(`[!] Pool ${pairName} terlalu kecil (${poolBalance} ${TOKEN_SYMBOLS[fromDenom]}), skip swap.`);
    return false;
  }
  return true;
}

// Function to get account balance with retry mechanism
async function getBalance(address, denom) {
  const MAX_RETRIES = 3;
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      const client = await getReadOnlyClient();
      const bal = await client.getBalance(address, denom);
      return bal && bal.amount ? parseFloat(bal.amount) / Math.pow(10, TOKEN_DECIMALS[denom] || 6) : 0;
    } catch (e) {
      logger.warn(`Percobaan ${attempt + 1}/${MAX_RETRIES} untuk mendapatkan saldo gagal: ${e.message}`);
      if ((e.message.includes('429') || e.message.includes('Bad status')) && attempt < MAX_RETRIES - 1) {
        const delayMs = Math.pow(2, attempt) * 1000; // Exponential backoff (1s, 2s, 4s)
        logger.info(`Mencoba lagi dalam ${delayMs / 1000} detik...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        attempt++;
      } else {
        logger.error(`Gagal mendapatkan saldo setelah beberapa percobaan: ${e.message}`);
        return 0;
      }
    }
  }
  logger.error("Gagal mendapatkan saldo setelah beberapa percobaan.");
  return 0;
}

// Function to get user points with retry mechanism
async function getUserPoints(address) {
  const MAX_RETRIES = 3;
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      const response = await fetch(`${API_URL}user/${address}`);
      if (!response.ok) {
        if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES - 1) { // Also retry on 5xx errors
          logger.warn(`Percobaan ${attempt + 1}/${MAX_RETRIES} untuk mendapatkan poin pengguna gagal: Status ${response.status}`);
          const delayMs = Math.pow(2, attempt) * 1000; // Exponential backoff
          logger.info(`Mencoba lagi dalam ${delayMs / 1000} detik...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          attempt++;
          continue; // Continue to the next attempt
        }
        return 0; // Return 0 if not ok and not 429/5xx or last attempt
      }
      const data = await response.json();
      if (data && typeof data.point !== 'undefined') return data.point;
      if (data && data.data && typeof data.data.point !== 'undefined') return data.data.point;
      return 0;
    } catch (e) {
      logger.warn(`Percobaan ${attempt + 1}/${MAX_RETRIES} untuk mendapatkan poin pengguna gagal: ${e.message}`);
      if (attempt < MAX_RETRIES - 1) {
        const delayMs = Math.pow(2, attempt) * 1000; // Exponential backoff
        logger.info(`Mencoba lagi dalam ${delayMs / 1000} detik...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        attempt++;
      } else {
        logger.error(`Gagal mendapatkan poin pengguna setelah beberapa percobaan: ${e.message}`);
        return 0;
      }
    }
  }
  logger.error("Gagal mendapatkan poin pengguna setelah beberapa percobaan.");
  return 0;
}

async function getAllBalances(address) {
  const denoms = Object.keys(TOKEN_SYMBOLS);
  const balances = {};
  for (const denom of denoms) {
    balances[denom] = await getBalance(address, denom);
  }
  return balances;
}

async function printWalletInfo(address) {
  const points = await getUserPoints(address);
  logger.info(`Wallet: ${address}`);
  logger.info(`Points: ${points}`);
  const balances = await getAllBalances(address);
  let balanceStr = '[✓] Balance: ';
  for (const denom of Object.keys(TOKEN_SYMBOLS)) {
    const symbol = TOKEN_SYMBOLS[denom];
    const val = balances[denom];
    balanceStr += `${symbol} ${val} | `;
  }
  balanceStr = balanceStr.replace(/\s\|\s$/, ''); // Remove trailing '|'
  logger.info(balanceStr);
  return { points, balances };
}

function calculateBeliefPrice(poolInfo, pairName, fromDenom) {
  try {
    if (!poolInfo || !poolInfo.assets || poolInfo.assets.length !== 2) {
      logger.warn(`Belief price fallback to 1 for ${pairName}`);
      return "1";
    }
    const pair = TOKEN_PAIRS[pairName];
    let amountToken1 = 0, amountToken2 = 0;
    poolInfo.assets.forEach(asset => {
      if (asset.info.native_token && asset.info.native_token.denom === pair.token1) {
        amountToken1 = parseFloat(asset.amount) / Math.pow(10, TOKEN_DECIMALS[pair.token1]);
      }
      if (asset.info.native_token && asset.info.native_token.denom === pair.token2) {
        amountToken2 = parseFloat(asset.amount) / Math.pow(10, TOKEN_DECIMALS[pair.token2]);
      }
    });
    let price;
    if (fromDenom === pair.token1) {
      price = amountToken2 / amountToken1;
    } else {
      price = amountToken1 / amountToken2;
    }
    logger.info(`Belief price untuk ${pairName}: ${price}`);
    return price.toFixed(18);
  } catch (err) {
    logger.warn(`Belief price fallback to 1 for ${pairName}`);
    return "1";
  }
}

async function performSwap(wallet, address, amount, pairName, swapNumber, fromDenom, toDenom) {
  try {
    const pair = TOKEN_PAIRS[pairName];
    if (!pair.contract) {
      logger.error(`Contract address not set for ${pairName}`);
      return null;
    }
    const balance = await getBalance(address, fromDenom);
    if (balance < amount) {
      logger.warn(`[!] Skip swap ${swapNumber}: saldo ${TOKEN_SYMBOLS[fromDenom] || fromDenom} (${balance}) kurang dari swap (${amount})`);
      return null;
    }
    if (!(await canSwap(pairName, fromDenom, amount))) {
      logger.warn(`[!] Skip swap ${swapNumber}: pool terlalu kecil untuk swap.`);
      return null;
    }

    // Get client with proxy support for signing transaction
    const client = await getConnectedClient(wallet);

    const microAmount = toMicroUnits(amount, fromDenom);
    const poolInfo = await getPoolInfo(pair.contract);
    const beliefPrice = calculateBeliefPrice(poolInfo, pairName, fromDenom);

    // Increased slippage tolerance to mitigate 'max spread limit' error
    const slippageTolerance = "0.01"; // 10% slippage tolerance

    const msg = {
      swap: {
        belief_price: beliefPrice,
        max_spread: slippageTolerance, // Using slippageTolerance here
        offer_asset: {
          amount: microAmount.toString(),
          info: { native_token: { denom: fromDenom } },
        },
      },
    };
    const funds = coins(microAmount, fromDenom);
    const fromSymbol = TOKEN_SYMBOLS[fromDenom] || fromDenom;
    const toSymbol = TOKEN_SYMBOLS[toDenom] || toDenom;

    logger.swap(`Swap ${swapNumber}: ${amount.toFixed(5)} ${fromSymbol} -> ${toSymbol}`);
    logger.info(`Slippage tolerance: ${slippageTolerance}`);
    const result = await client.execute(address, pair.contract, msg, 'auto', 'Swap', funds);
    logger.swapSuccess(`Complete swap ${swapNumber}: ${fromSymbol} -> ${toSymbol} | Tx: ${EXPLORER_URL}${result.transactionHash}`);
    return result;
  } catch (error) {
    logger.error(`Swap ${swapNumber} failed: ${error.message}`);
    return null;
  }
}

async function addLiquidity(wallet, address, pairName, liquidityNumber) {
  try {
    const pair = TOKEN_PAIRS[pairName];
    if (!pair.contract) {
      logger.error(`Contract address not set for ${pairName}`);
      return null;
    }
    const saldoToken1 = await getBalance(address, pair.token1);
    const saldoZIG = await getBalance(address, 'uzig');
    if (saldoToken1 === 0 || saldoZIG === 0) {
      logger.warn(`Skip add liquidity ${pairName}: saldo kurang`);
      return null;
    }
    const token1Amount = saldoToken1 * 0.01; // Use 1% of balance
    const zigAmount = saldoZIG * 0.01; // Use 1% of balance

    const poolInfo = await getPoolInfo(pair.contract);
    if (!poolInfo) {
      logger.warn(`Skip add liquidity ${pairName}: pool info tidak didapat`);
      return null;
    }

    // Determine which asset is token1 and which is token2 in the poolInfo
    let poolToken1Asset, poolZIGAsset;
    if (poolInfo.assets[0].info.native_token?.denom === pair.token1) {
        poolToken1Asset = poolInfo.assets[0];
        poolZIGAsset = poolInfo.assets[1];
    } else {
        poolToken1Asset = poolInfo.assets[1];
        poolZIGAsset = poolInfo.assets[0];
    }

    const poolToken1 = parseFloat(poolToken1Asset.amount) / Math.pow(10, TOKEN_DECIMALS[pair.token1]);
    const poolZIG = parseFloat(poolZIGAsset.amount) / Math.pow(10, TOKEN_DECIMALS['uzig']);

    // Calculate ratio based on current pool
    const ratio = poolToken1 / poolZIG;

    let adjustedToken1 = token1Amount;
    let adjustedZIG = zigAmount;

    // Adjust amounts to maintain ratio, prioritizing the smaller resulting token amount
    if (token1Amount / zigAmount > ratio) {
        // If our token1 amount is proportionally too high
        adjustedToken1 = zigAmount * ratio;
    } else {
        // If our ZIG amount is proportionally too high
        adjustedZIG = token1Amount / ratio;
    }

    // Ensure we don't try to add more than we have
    adjustedToken1 = Math.min(adjustedToken1, saldoToken1);
    adjustedZIG = Math.min(adjustedZIG, saldoZIG);

    const microAmountToken1 = toMicroUnits(adjustedToken1, pair.token1);
    const microAmountZIG = toMicroUnits(adjustedZIG, 'uzig');

    if (microAmountToken1 === 0 || microAmountZIG === 0) {
        logger.warn(`Skip add liquidity ${pairName}: calculated amounts are zero.`);
        return null;
    }

    logger.liquidity(`Liquidity ${liquidityNumber}: Adding (5% approx) ${adjustedToken1.toFixed(6)} ${TOKEN_SYMBOLS[pair.token1]} + ${adjustedZIG.toFixed(6)} ZIG`);

    const msg = {
      provide_liquidity: {
        assets: [
          { amount: microAmountToken1.toString(), info: { native_token: { denom: pair.token1 } } },
          { amount: microAmountZIG.toString(), info: { native_token: { denom: 'uzig' } } },
        ],
        slippage_tolerance: "0.01", // Slippage tolerance for liquidity
      },
    };
    const funds = [
      { denom: pair.token1, amount: microAmountToken1.toString() },
      { denom: 'uzig', amount: microAmountZIG.toString() }
    ];

    // Get client with proxy support for signing transaction
    const client = await getConnectedClient(wallet);

    const result = await client.execute(address, pair.contract, msg, 'auto', `Adding ${pairName} Liquidity`, funds);
    logger.success(`Liquidity added for ${pairName}! Tx: ${EXPLORER_URL}${result.transactionHash}`);
    logger.liquiditySuccess(`Add Liquidity Completed for ${pairName}`);
    return result;
  } catch (error) {
    logger.error(`Add liquidity failed for ${pairName}: ${error.message}`);
    return null;
  }
}

function displayCountdown(hours, minutes, seconds) {
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  process.stdout.write(`\r${colors.cyan}[🧭] Next execution in: ${timeStr}${colors.reset}`);
}

async function executeTransactionCycle(
  wallet,
  address,
  walletNumber,
  numSwaps,
  numAddLiquidity,
  minDelay, // Consolidated delay
  maxDelay  // Consolidated delay
) {
  log_message(`${colors.blue}=== Processing Account [${address.slice(0, 6)}...${address.slice(-6)}] ===${colors.reset}`);
  await printWalletInfo(address);

  let swapNo = 1;
  for (let i = 0; i < numSwaps; i++) {
    const idx = i % SWAP_SEQUENCE.length;
    const { from, to, pair } = SWAP_SEQUENCE[idx];
    const swapAmount = getRandomSwapAmount();
    await performSwap(wallet, address, swapAmount, pair, swapNo++, from, to);
    const delay = getRandomDelay(minDelay, maxDelay); // Use consolidated delay
    await new Promise(resolve => setTimeout(resolve, delay * 1000));
  }
  let liquidityNo = 1;
  for (let i = 0; i < numAddLiquidity; i++) {
    const pairName = LIQUIDITY_PAIRS[i % LIQUIDITY_PAIRS.length];
    await addLiquidity(wallet, address, pairName, liquidityNo++);
    const liquidityDelay = getRandomDelay(minDelay, maxDelay); // Use consolidated delay
    await new Promise(resolve => setTimeout(resolve, liquidityDelay * 1000));
  }
  log_message(`${colors.blue}=== Account Processing Finished ===${colors.reset}\n`);
}

async function executeAllWallets(
  keys,
  numSwaps,
  numAddLiquidity,
  minDelay, // Consolidated delay
  maxDelay  // Consolidated delay
) {
  for (let walletIndex = 0; walletIndex < keys.length; walletIndex++) {
    const key = keys[walletIndex];
    try {
      const wallet = await getWallet(key);
      const address = await getAccountAddress(wallet);
      await executeTransactionCycle(
        wallet,
        address,
        walletIndex + 1,
        numSwaps,
        numAddLiquidity,
        minDelay, // Pass consolidated delay
        maxDelay  // Pass consolidated delay
      );
    } catch (error) {
      logger.error(`Error processing wallet ${walletIndex + 1}: ${error.message}`);
    }
  }
}

async function startDailyCountdown(
  keys,
  numSwaps,
  numAddLiquidity,
  minDelay, // Consolidated delay
  maxDelay  // Consolidated delay
) {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  while (true) {
    const startTime = Date.now();
    const endTime = startTime + TWENTY_FOUR_HOURS;
    while (Date.now() < endTime) {
      const remaining = endTime - Date.now();
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      displayCountdown(hours, minutes, seconds);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('\n');
    logger.success('🧭 24 hours completed! Starting new transaction cycle...\n');
    await executeAllWallets(
      keys,
      numSwaps,
      numAddLiquidity,
      minDelay, // Pass consolidated delay
      maxDelay  // Pass consolidated delay
    );
  }
}

async function main() {
  await display_welcome_screen();

  const keys = Object.keys(process.env)
    .filter((key) => key.startsWith('PRIVATE_KEY_'))
    .map((key) => process.env[key]);
  if (keys.length === 0) {
    logger.error('No private keys or mnemonics found in .env file');
    rl.close();
    return;
  }
  let numSwaps;
  while (true) {
    const input = await prompt(`${colors.green + colors.bold}Number of swaps per wallet: ${colors.reset}`);
    if (isValidNumber(input)) {
      numSwaps = parseInt(input);
      break;
    }
    logger.error('Invalid input. Please enter a positive number.');
  }
  let numAddLiquidity;
  while (true) {
    const input = await prompt(`${colors.green + colors.bold}Number of add liquidity per wallet: ${colors.reset}`);
    if (isValidNumber(input)) {
      numAddLiquidity = parseInt(input);
      break;
    }
    logger.error('Invalid input. Please enter a positive number.');
  }

  // Consolidated delay inputs
  let minDelay, maxDelay;
  while (true) {
    const input = await prompt(`${colors.green + colors.bold}Min delay between transactions (seconds): ${colors.reset}`);
    if (isValidNumber(input)) {
      minDelay = parseInt(input);
      break;
    }
    logger.error('Invalid input. Please enter a positive number.');
  }
  while (true) {
    const input = await prompt(`${colors.green + colors.bold}Max delay between transactions (seconds): ${colors.reset}`);
    if (isValidNumber(input) && parseInt(input) >= minDelay) {
      maxDelay = parseInt(input);
      break;
    }
    logger.error(`Invalid input. Please enter a number greater than or equal to ${minDelay}.`);
  }

  // Proxy support choice - now loads from file
  while (true) {
    const choiceInput = await prompt(`${colors.green + colors.bold}Choose proxy type: \n1. Private Proxy (from proxy.txt)\n2. No Proxy\nEnter choice (1 or 2): ${colors.reset}`);
    if (choiceInput === '1') {
      useProxy = true; // Set global flag to enable proxy logic
      proxyList = await loadProxiesFromFile(); // Load proxies from file
      if (proxyList.length === 0) {
        logger.warn('No proxies loaded from proxy.txt. Proceeding without proxies.');
        useProxy = false;
      } else {
        logger.info(`Using ${proxyList.length} proxies from proxy.txt. Proxy will rotate per transaction.`);
        logger.info(`[i] Remember to install required modules:`);
        logger.info(`    Run: npm install socks-proxy-agent @cosmjs/tendermint-rpc`);

        // Ask about removing failed proxies
        const removeFailedInput = await prompt(`${colors.green + colors.bold}Rotate Invalid Proxy? (y/n): ${colors.reset}`);
        removeFailedProxy = removeFailedInput.toLowerCase() === 'y';
        if (removeFailedProxy) {
            logger.info('Failed proxies will be removed from the list.');
        } else {
            logger.info('Failed proxies will NOT be removed from the list.');
        }
      }
      break;
    } else if (choiceInput === '2') {
      logger.info('Proceeding without proxies.');
      useProxy = false; // Ensure global flag is false
      break;
    } else {
      logger.error('Invalid choice. Please enter 1 or 2.');
    }
  }

  console.log();
  await executeAllWallets(
    keys,
    numSwaps,
    numAddLiquidity,
    minDelay,
    maxDelay
  );
  await startDailyCountdown(
    keys,
    numSwaps,
    numAddLiquidity,
    minDelay,
    maxDelay
  );
}

main().catch((error) => {
  logger.error(`Bot failed: ${error.message}`);
  rl.close();
});
