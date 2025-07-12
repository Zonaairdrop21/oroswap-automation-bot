import dotenv from 'dotenv';
import { createInterface } from 'node:readline';

import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import pkg from '@cosmjs/stargate';
const { GasPrice, coins } = pkg;
import pkg2 from '@cosmjs/proto-signing';
const { DirectSecp256k1HdWallet, DirectSecp256k1Wallet } = pkg2;

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

const logger = {
  _ts: () => {
    const now = new Date();
    return `[${now.toLocaleTimeString('id-ID', { hour12: false })]`;
  },
  info: (msg) => console.log(`${colors.cyan}${logger._ts()} [INFO] ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}${logger._ts()} [WARN] ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}${logger._ts()} [ERR!] ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}${logger._ts()} [✔ OK] ${msg}${colors.reset}`),
  loading: (msg) => console.log(`${colors.cyan}${logger._ts()} [....] ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.white}${logger._ts()} [→] ${msg}${colors.reset}`),
  swap: (msg) => console.log(`${colors.cyan}${logger._ts()} [↪️ SWAP] ${msg}${colors.reset}`),
  swapSuccess: (msg) => console.log(`${colors.green}${logger._ts()} [✅ SWAP] ${msg}${colors.reset}`),
  liquidity: (msg) => console.log(`${colors.cyan}${logger._ts()} [💧 LIQ] ${msg}${colors.reset}`),
  liquiditySuccess: (msg) => console.log(`${colors.green}${logger._ts()} [✅ LIQ] ${msg}${colors.reset}`),

  banner: () => {
    console.clear();
    console.log(`${colors.bold}${colors.cyan}`);
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║██████╗ ██████╗  ██████╗ ███████╗ █████╗ ██████╗ ███████╗██████╗║');
    console.log('║██╔══██╗██╔══██╗██╔═══██╗██╔════╝██╔══██╗██╔══██╗██╔════╝╚════██╗║');
    console.log('║██████╔╝██████╔╝██║   ██║███████╗███████║██████╔╝█████╗   █████╔╝║');
    console.log('║██╔══██╗██╔══██╗██║   ██║╚════██║██╔══██║██╔═══╝ ██╔══╝  ██╔═══╝ ║');
    console.log('║██║  ██║██║  ██║╚██████╔╝███████║██║  ██║██║     ███████╗███████╗║');
    console.log('║╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝╚══════╝║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║                 🚀 OROSWAP ZONA-AIRDROP BOT 🚀              ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║ 🔹 Version  : 2.0.1                                         ║`);
    console.log(`║ 🔹 Network  : ZigChain Testnet (${RPC_URL})                 ║`);
    console.log(`║ 🔹 Explorer : ${EXPLORER_URL}                               ║`);
    console.log(`║ 🔹 Support  : @ZonaAirdr0p                                  ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`${colors.reset}`);
    console.log(`${colors.yellow}🚨 Disclaimer: Use at your own risk. The team is not responsible for any losses.${colors.reset}\n`);
  }
};

const RPC_URL = 'https://testnet-rpc.zigchain.com';
const API_URL = 'https://testnet-api.zigchain.com';
const EXPLORER_URL = 'https://zigscan.org/tx/';
const GAS_PRICE = GasPrice.fromString('0.026uzig');

// Extended token symbols including new tokens: STZIG, DYOR, BEE
const TOKEN_SYMBOLS = {
  'uzig': 'ZIG',
  'coin.zig10rfjm85jmzfhravjwpq3hcdz8ngxg7lxd0drkr.uoro': 'ORO',
  'coin.zig1qaf4dvjt5f8naam2mzpmysjm5e8sp2yhrzex8d.nfa': 'NFA',
  'coin.zig12jgpgq5ec88nwzkkjx7jyrzrljpph5pnags8sn.ucultcoin': 'CULTCOIN',
  'zig1f6dk5csplyvyqvk7uvtsf8yll82lxzmquzctw7wvwajn2a7emmeqzzgvly': 'STZIG',
  'coin.zig1fepzhtkq2r5gc4prq94yukg6vaqjvkam27gwk3.dyor': 'DYOR',
  'coin.zig1ptxpjgl3lsxrq99zl6ad2nmrx4lhnhne26m6ys.bee': 'BEE',
};

// Extended token pairs including new pairs with bidirectional support
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
  },
  'STZIG/ZIG': {
    contract: 'zig19zqxslng99gw98ku3dyqaqy0c809kwssw7nzhea9x40jwxjugqvs5xaghj',
    token1: 'zig1f6dk5csplyvyqvk7uvtsf8yll82lxzmquzctw7wvwajn2a7emmeqzzgvly',
    token2: 'uzig'
  },
  'DYOR/ZIG': {
    contract: 'zig1us8t6pklp2v2pjqnnedg9wnp3pv50kl448csv0lsuad599ef56jsyvakl9',
    token1: 'coin.zig1fepzhtkq2r5gc4prq94yukg6vaqjvkam27gwk3.dyor',
    token2: 'uzig'
  },
  'BEE/ZIG': {
    contract: 'zig1r50m5lafnmctat4xpvwdpzqndynlxt2skhr4fhzh76u0qar2y9hqu74u5h',
    token1: 'coin.zig1ptxpjgl3lsxrq99zl6ad2nmrx4lhnhne26m6ys.bee',
    token2: 'uzig'
  }
};

// Token decimals including new tokens (assuming 6 decimals like existing tokens)
const TOKEN_DECIMALS = {
  'uzig': 6,
  'coin.zig10rfjm85jmzfhravjwpq3hcdz8ngxg7lxd0drkr.uoro': 6,
  'coin.zig1qaf4dvjt5f8naam2mzpmysjm5e8sp2yhrzex8d.nfa': 6,
  'coin.zig12jgpgq5ec88nwzkkjx7jyrzrljpph5pnags8sn.ucultcoin': 6,
  'zig1f6dk5csplyvyqvk7uvtsf8yll82lxzmquzctw7wvwajn2a7emmeqzzgvly': 6,
  'coin.zig1fepzhtkq2r5gc4prq94yukg6vaqjvkam27gwk3.dyor': 6,
  'coin.zig1ptxpjgl3lsxrq99zl6ad2nmrx4lhnhne26m6ys.bee': 6,
};

// Extended swap sequence with bidirectional swaps for all tokens
const SWAP_SEQUENCE = [
  // Original tokens
  { from: 'uzig', to: 'coin.zig10rfjm85jmzfhravjwpq3hcdz8ngxg7lxd0drkr.uoro', pair: 'ORO/ZIG' },
  { from: 'uzig', to: 'coin.zig1qaf4dvjt5f8naam2mzpmysjm5e8sp2yhrzex8d.nfa', pair: 'NFA/ZIG' },
  { from: 'uzig', to: 'coin.zig12jgpgq5ec88nwzkkjx7jyrzrljpph5pnags8sn.ucultcoin', pair: 'CULTCOIN/ZIG' },
  
  // New tokens - ZIG to token
  { from: 'uzig', to: 'zig1f6dk5csplyvyqvk7uvtsf8yll82lxzmquzctw7wvwajn2a7emmeqzzgvly', pair: 'STZIG/ZIG' },
  { from: 'uzig', to: 'coin.zig1fepzhtkq2r5gc4prq94yukg6vaqjvkam27gwk3.dyor', pair: 'DYOR/ZIG' },
  { from: 'uzig', to: 'coin.zig1ptxpjgl3lsxrq99zl6ad2nmrx4lhnhne26m6ys.bee', pair: 'BEE/ZIG' },
  
  // New tokens - token to ZIG (bidirectional)
  { from: 'zig1f6dk5csplyvyqvk7uvtsf8yll82lxzmquzctw7wvwajn2a7emmeqzzgvly', to: 'uzig', pair: 'STZIG/ZIG' },
  { from: 'coin.zig1fepzhtkq2r5gc4prq94yukg6vaqjvkam27gwk3.dyor', to: 'uzig', pair: 'DYOR/ZIG' },
  { from: 'coin.zig1ptxpjgl3lsxrq99zl6ad2nmrx4lhnhne26m6ys.bee', to: 'uzig', pair: 'BEE/ZIG' },
];

// Extended liquidity pairs including new one-way pairs
const LIQUIDITY_PAIRS = [
  'ORO/ZIG',
  'NFA/ZIG',
  'CULTCOIN/ZIG',
  'STZIG/ZIG',
  'DYOR/ZIG',
  'BEE/ZIG'
];

function getRandomMaxSpread() {
  const min = 0.01;
  const max = 0.005;
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
  return Math.floor(parseFloat(amount) * Math.pow(10, decimals);
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
  const min = 0.013;
  const max = 0.012;
  return Math.random() * (max - min) + min;
}

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getPoolInfo(contractAddress) {
  try {
    const client = await SigningCosmWasmClient.connect(RPC_URL);
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
  if (poolBalance <= 10 * amount) {
    logger.warn(`[!] Pool ${pairName} terlalu kecil (${poolBalance} ${fromDenom}), skip swap.`);
    return false;
  }
  return true;
}

async function getBalance(address, denom) {
  try {
    const client = await SigningCosmWasmClient.connect(RPC_URL);
    const bal = await client.getBalance(address, denom);
    return bal && bal.amount ? parseFloat(bal.amount) / Math.pow(10, TOKEN_DECIMALS[denom] || 6) : 0;
  } catch (e) {
    logger.error("Gagal getBalance: " + e.message);
    return 0;
  }
}

async function getUserPoints(address) {
  try {
    const response = await fetch(`${API_URL}user/${address}`);
    if (!response.ok) return 0;
    const data = await response.json();
    if (data && typeof data.point !== 'undefined') return data.point;
    if (data && data.data && typeof data.data.point !== 'undefined') return data.data.point;
    return 0;
  } catch (e) {
    return 0;
  }
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
  balanceStr = balanceStr.replace(/\s\|\s$/, ''); // hapus strip di akhir
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
    const client = await SigningCosmWasmClient.connectWithSigner(RPC_URL, wallet, { gasPrice: GAS_PRICE });
    const microAmount = toMicroUnits(amount, fromDenom);
    const poolInfo = await getPoolInfo(pair.contract);
    const beliefPrice = calculateBeliefPrice(poolInfo, pairName, fromDenom);
    // max_spread dihapus (default ke 0.01 jika diperlukan)
    const maxSpread = "0.005";
    const msg = {
      swap: {
        belief_price: beliefPrice,
        max_spread: maxSpread,
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
    logger.info(`Max spread swap: ${maxSpread}`);
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
    const token1Amount = saldoToken1 * 0.2;
    const zigAmount = saldoZIG * 0.2;
    const poolInfo = await getPoolInfo(pair.contract);
    if (!poolInfo) {
      logger.warn(`Skip add liquidity ${pairName}: pool info tidak didapat`);
      return null;
    }
    const poolToken1 = parseFloat(poolInfo.assets[0].amount) / Math.pow(10, TOKEN_DECIMALS[pair.token1]);
    const poolZIG = parseFloat(poolInfo.assets[1].amount) / Math.pow(10, TOKEN_DECIMALS['uzig']);
    const ratio = poolToken1 / poolZIG;
    let adjustedToken1 = token1Amount;
    let adjustedZIG = zigAmount;
    if (token1Amount / zigAmount > ratio) {
      adjustedToken1 = zigAmount * ratio;
    } else {
      adjustedZIG = token1Amount / ratio;
    }
    const microAmountToken1 = toMicroUnits(adjustedToken1, pair.token1);
    const microAmountZIG = toMicroUnits(adjustedZIG, 'uzig');
    logger.liquidity(`Liquidity ${liquidityNumber}: Adding (5%) ${adjustedToken1.toFixed(6)} ${TOKEN_SYMBOLS[pair.token1]} + ${adjustedZIG.toFixed(6)} ZIG`);
    const msg = {
      provide_liquidity: {
        assets: [
          { amount: microAmountToken1.toString(), info: { native_token: { denom: pair.token1 } } },
          { amount: microAmountZIG.toString(), info: { native_token: { denom: 'uzig' } } },
        ],
        slippage_tolerance: "0.5",
      },
    };
    const funds = [
      { denom: pair.token1, amount: microAmountToken1.toString() },
      { denom: 'uzig', amount: microAmountZIG.toString() }
    ];
    const client = await SigningCosmWasmClient.connectWithSigner(RPC_URL, wallet, { gasPrice: GAS_PRICE });
    const result = await client.execute(address, pair.contract, msg, 'auto', `Adding ${pairName} Liquidity`, funds);
    logger.liquiditySuccess(`Complete add liquidity ${liquidityNumber}: ${pairName} | Tx: ${EXPLORER_URL}${result.transactionHash}`);
    return result;
  } catch (error) {
    logger.error(`Add liquidity ${liquidityNumber} failed: ${error.message}`);
    return null;
  }
}

async function waitForDelay(delayMinutes) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMinutes * 60 * 1000);
  });
}

async function executeSwapSequence(wallet, address, swapCount) {
  let completedSwaps = 0;
  let swapNumber = 1;

  for (let i = 0; i < swapCount; i++) {
    for (const swapConfig of SWAP_SEQUENCE) {
      const amount = getRandomSwapAmount();
      logger.step(`Starting swap ${swapNumber}/${swapCount * SWAP_SEQUENCE.length}`);
      
      const result = await performSwap(
        wallet,
        address,
        amount,
        swapConfig.pair,
        swapNumber,
        swapConfig.from,
        swapConfig.to
      );

      if (result) {
        completedSwaps++;
        const delaySeconds = getRandomDelay(5, 15);
        logger.info(`Waiting ${delaySeconds} seconds before next swap...`);
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      }

      swapNumber++;
    }
  }

  logger.success(`Completed ${completedSwaps} out of ${swapCount * SWAP_SEQUENCE.length} swaps`);
  return completedSwaps;
}

async function executeLiquiditySequence(wallet, address, liquidityCount) {
  let completedLiquidity = 0;
  let liquidityNumber = 1;

  for (let i = 0; i < liquidityCount; i++) {
    for (const pairName of LIQUIDITY_PAIRS) {
      logger.step(`Starting liquidity ${liquidityNumber}/${liquidityCount * LIQUIDITY_PAIRS.length}`);
      
      const result = await addLiquidity(wallet, address, pairName, liquidityNumber);

      if (result) {
        completedLiquidity++;
        const delaySeconds = getRandomDelay(5, 15);
        logger.info(`Waiting ${delaySeconds} seconds before next liquidity...`);
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      }

      liquidityNumber++;
    }
  }

  logger.success(`Completed ${completedLiquidity} out of ${liquidityCount * LIQUIDITY_PAIRS.length} liquidity operations`);
  return completedLiquidity;
}

async function main() {
  try {
    logger.banner();

    // Get wallet credentials
    const key = await prompt('Enter your private key or mnemonic: ');
    const wallet = await getWallet(key);
    const address = await getAccountAddress(wallet);

    // Print wallet info
    await printWalletInfo(address);

    // Get operation counts
    const swapCountInput = await prompt('Enter number of swap cycles: ');
    const liquidityCountInput = await prompt('Enter number of liquidity cycles: ');
    const delayInput = await prompt('Enter delay between cycles (minutes): ');

    if (!isValidNumber(swapCountInput) || !isValidNumber(liquidityCountInput) || !isValidNumber(delayInput)) {
      logger.error('Invalid input. Please enter valid numbers.');
      process.exit(1);
    }

    const swapCount = parseInt(swapCountInput);
    const liquidityCount = parseInt(liquidityCountInput);
    const delayMinutes = parseInt(delayInput);

    logger.info(`Starting automated operations:`);
    logger.info(`- ${swapCount} swap cycles (${swapCount * SWAP_SEQUENCE.length} total swaps)`);
    logger.info(`- ${liquidityCount} liquidity cycles (${liquidityCount * LIQUIDITY_PAIRS.length} total liquidity operations)`);
    logger.info(`- ${delayMinutes} minute delay between cycles`);
    logger.info(`- Supported tokens: ${Object.values(TOKEN_SYMBOLS).join(', ')}`);

    // Execute operations
    let cycle = 1;
    const totalCycles = Math.max(swapCount, liquidityCount);

    for (let i = 0; i < totalCycles; i++) {
      logger.step(`Starting cycle ${cycle}/${totalCycles}`);

      // Execute swaps if needed
      if (i < swapCount) {
        logger.info('Executing swap sequence...');
        await executeSwapSequence(wallet, address, 1);
      }

      // Execute liquidity if needed
      if (i < liquidityCount) {
        logger.info('Executing liquidity sequence...');
        await executeLiquiditySequence(wallet, address, 1);
      }

      // Wait between cycles (except for last cycle)
      if (i < totalCycles - 1) {
        logger.info(`Waiting ${delayMinutes} minutes before next cycle...`);
        await waitForDelay(delayMinutes);
      }

      cycle++;
    }

    logger.success('All operations completed successfully!');
    
    // Print final wallet info
    logger.info('\nFinal wallet status:');
    await printWalletInfo(address);

  } catch (error) {
    logger.error(`Application error: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  logger.warn('\nApplication interrupted by user');
  rl.close();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error.message}`);
  rl.close();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled rejection at: ${promise}, reason: ${reason}`);
  rl.close();
  process.exit(1);
});

// Start the application
main().catch(error => {
  logger.error(`Fatal error: ${error.message}`);
  rl.close();
  process.exit(1);
});