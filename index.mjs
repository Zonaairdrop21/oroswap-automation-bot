#!/usr/bin/env node
import dotenv from 'dotenv';
import { createInterface } from 'node:readline';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { GasPrice, coins } from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet, DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import boxen from 'boxen';
import ora from 'ora';

// ================
// INITIALIZATION
// ================
dotenv.config();
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ======================
// ENHANCED UI COMPONENTS
// ======================
const cyberGradient = gradient('purple', 'violet', 'cyan');
const errorGradient = gradient('red', 'orange');
const successGradient = gradient('green', 'lime');

const displayHeader = () => {
  console.clear();
  console.log(
    boxen(
      cyberGradient(
        figlet.textSync('OROSWAP', {
          font: 'Cyberlarge',
          horizontalLayout: 'full'
        })
      ),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'cyan'
      }
    )
  );

  console.log(
    boxen(
      chalk.bold.cyan('🚀 ZONA-AIRDROP BOT v2.1 ') + 
      chalk.yellow('|') +
      chalk.hex('#BA55D3')(' 🔗 ZigChain Testnet') +
      chalk.yellow(' |') +
      chalk.hex('#00FFFF')(' ⚡ By @ZonaAirdr0p'),
      { padding: 1, borderColor: 'magenta' }
    )
  );
};

// =================
// ENHANCED LOGGER
// =================
const logger = {
  _ts: () => chalk.gray(`[${new Date().toLocaleTimeString('en-US', { hour12: false })}]`),

  info: (msg) => console.log(`${logger._ts()} ${chalk.cyan('›')} ${chalk.cyan(msg)}`),

  warn: (msg) => console.log(`${logger._ts()} ${chalk.yellow('⚠')} ${chalk.yellow(msg)}`),

  error: (msg) => console.log(`${logger._ts()} ${chalk.red('✗')} ${errorGradient(msg)}`),

  success: (msg) => console.log(`${logger._ts()} ${chalk.green('✓')} ${successGradient(msg)}`),

  swap: (msg) => {
    const spinner = ora({
      text: `${logger._ts()} ${chalk.hex('#FF00FF')('⟳')} ${chalk.cyan(msg)}`,
      spinner: 'bouncingBar'
    }).start();
    return spinner;
  },

  liquidity: (msg) => {
    const spinner = ora({
      text: `${logger._ts()} ${chalk.hex('#00FFFF')('💧')} ${chalk.cyan(msg)}`,
      spinner: 'dots'
    }).start();
    return spinner;
  }
};

// ==============
// CONFIGURATION
// ==============
const RPC_URL = 'https://testnet-rpc.zigchain.com';
const API_URL = 'https://testnet-api.zigchain.com';
const EXPLORER_URL = 'https://zigscan.org/tx/';
const GAS_PRICE = GasPrice.fromString('0.026uzig');

const TOKEN_SYMBOLS = {
  'uzig': 'ZIG',
  'coin.zig10rfjm85jmzfhravjwpq3hcdz8ngxg7lxd0drkr.uoro': 'ORO',
  'coin.zig1qaf4dvjt5f8naam2mzpmysjm5e8sp2yhrzex8d.nfa': 'NFA',
  'coin.zig12jgpgq5ec88nwzkkjx7jyrzrljpph5pnags8sn.ucultcoin': 'CULTCOIN',
  'zig1f6dk5csplyvyqvk7uvtsf8yll82lxzmquzctw7wvwajn2a7emmeqzzgvly': 'STZIG',
  'coin.zig1fepzhtkq2r5gc4prq94yukg6vaqjvkam27gwk3.dyor': 'DYOR',
  'coin.zig1ptxpjgl3lsxrq99zl6ad2nmrx4lhnhne26m6ys.bee': 'BEE',
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

const TOKEN_DECIMALS = {
  'uzig': 6,
  'coin.zig10rfjm85jmzfhravjwpq3hcdz8ngxg7lxd0drkr.uoro': 6,
  'coin.zig1qaf4dvjt5f8naam2mzpmysjm5e8sp2yhrzex8d.nfa': 6,
  'coin.zig12jgpgq5ec88nwzkkjx7jyrzrljpph5pnags8sn.ucultcoin': 6,
  'zig1f6dk5csplyvyqvk7uvtsf8yll82lxzmquzctw7wvwajn2a7emmeqzzgvly': 6,
  'coin.zig1fepzhtkq2r5gc4prq94yukg6vaqjvkam27gwk3.dyor': 6,
  'coin.zig1ptxpjgl3lsxrq99zl6ad2nmrx4lhnhne26m6ys.bee': 6,
};

const SWAP_SEQUENCE = [
  { from: 'uzig', to: 'coin.zig10rfjm85jmzfhravjwpq3hcdz8ngxg7lxd0drkr.uoro', pair: 'ORO/ZIG' },
  { from: 'uzig', to: 'coin.zig1qaf4dvjt5f8naam2mzpmysjm5e8sp2yhrzex8d.nfa', pair: 'NFA/ZIG' },
  { from: 'uzig', to: 'coin.zig12jgpgq5ec88nwzkkjx7jyrzrljpph5pnags8sn.ucultcoin', pair: 'CULTCOIN/ZIG' },
  { from: 'uzig', to: 'zig1f6dk5csplyvyqvk7uvtsf8yll82lxzmquzctw7wvwajn2a7emmeqzzgvly', pair: 'STZIG/ZIG' },
  { from: 'uzig', to: 'coin.zig1fepzhtkq2r5gc4prq94yukg6vaqjvkam27gwk3.dyor', pair: 'DYOR/ZIG' },
  { from: 'uzig', to: 'coin.zig1ptxpjgl3lsxrq99zl6ad2nmrx4lhnhne26m6ys.bee', pair: 'BEE/ZIG' },
  { from: 'zig1f6dk5csplyvyqvk7uvtsf8yll82lxzmquzctw7wvwajn2a7emmeqzzgvly', to: 'uzig', pair: 'STZIG/ZIG' },
  { from: 'coin.zig1fepzhtkq2r5gc4prq94yukg6vaqjvkam27gwk3.dyor', to: 'uzig', pair: 'DYOR/ZIG' },
  { from: 'coin.zig1ptxpjgl3lsxrq99zl6ad2nmrx4lhnhne26m6ys.bee', to: 'uzig', pair: 'BEE/ZIG' },
];

const LIQUIDITY_PAIRS = [
  'ORO/ZIG',
  'NFA/ZIG',
  'CULTCOIN/ZIG',
  'STZIG/ZIG',
  'DYOR/ZIG',
  'BEE/ZIG'
];

// ==============
// CORE FUNCTIONS
// ==============
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(chalk.hex('#BA55D3')(question), (answer) => {
      resolve(answer.trim());
    });
  });
}

async function getWallet(key) {
  const walletSpinner = ora({
    text: chalk.hex('#FF00FF')('Decrypting Cyber Wallet...'),
    spinner: 'hearts'
  }).start();

  try {
    let wallet;
    if (key.split(' ').length >= 12) {
      wallet = await DirectSecp256k1HdWallet.fromMnemonic(key, { prefix: 'zig' });
    } else if (/^[0-9a-fA-F]{64}$/.test(key)) {
      wallet = await DirectSecp256k1Wallet.fromKey(Buffer.from(key, 'hex'), 'zig');
    } else {
      throw new Error('Invalid key format');
    }

    walletSpinner.succeed(chalk.green('Wallet Decrypted!'));
    return wallet;
  } catch (error) {
    walletSpinner.fail(chalk.red('Wallet Decryption Failed!'));
    throw error;
  }
}

async function performSwap(wallet, address, amount, pairName, swapNumber, fromDenom, toDenom) {
  const swapSpinner = logger.swap(`SWAP ${swapNumber}: ${amount.toFixed(6)} ${TOKEN_SYMBOLS[fromDenom]} → ${TOKEN_SYMBOLS[toDenom]}`);
  
  try {
    const pair = TOKEN_PAIRS[pairName];
    const client = await SigningCosmWasmClient.connectWithSigner(RPC_URL, wallet, { gasPrice: GAS_PRICE });
    const microAmount = toMicroUnits(amount, fromDenom);
    
    const msg = {
      swap: {
        belief_price: "1",
        max_spread: "0.005",
        offer_asset: {
          amount: microAmount.toString(),
          info: { native_token: { denom: fromDenom } },
        },
      },
    };

    const funds = coins(microAmount, fromDenom);
    const result = await client.execute(address, pair.contract, msg, 'auto', 'Swap', funds);
    
    swapSpinner.succeed(
      chalk.green(`SWAP ${swapNumber} SUCCESS! `) +
      chalk.cyan(`${amount.toFixed(6)} ${TOKEN_SYMBOLS[fromDenom]} → ${TOKEN_SYMBOLS[toDenom]}`) +
      chalk.gray(` | TX: ${EXPLORER_URL}${result.transactionHash}`)
    );
    
    process.stdout.write('\x07'); // Success beep
    return result;
  } catch (error) {
    swapSpinner.fail(chalk.red(`SWAP FAILED: ${error.message}`));
    process.stdout.write('\x07\x07'); // Error beep
    return null;
  }
}

// [Additional core functions (getBalance, addLiquidity, etc.) remain the same as original]

// =============
// MAIN FLOW
// =============
async function main() {
  try {
    displayHeader();

    // Wallet Setup
    const key = await prompt('🔑 Enter private key/mnemonic: ');
    const wallet = await getWallet(key);
    const address = (await wallet.getAccounts())[0].address;

    // Display Wallet Info
    console.log(
      boxen(
        chalk.hex('#00FFFF')('🖥️  WALLET: ') + chalk.bold(address) + '\n\n' +
        chalk.hex('#FF00FF')('⚡ BALANCE: ') + '\n' +
        Object.entries(await getAllBalances(address))
          .map(([denom, val]) => 
            `  ${chalk.cyan(TOKEN_SYMBOLS[denom])}: ${chalk.yellow(val.toFixed(6))}`
          )
          .join('\n'),
        { padding: 1, borderColor: 'magenta' }
      )
    );

    // Get User Input
    const swapCount = parseInt(await prompt('🔄 Number of swap cycles: '));
    const liqCount = parseInt(await prompt('💧 Number of liquidity cycles: '));
    const delay = parseInt(await prompt('⏱️  Delay between cycles (minutes): '));

    // Execute Operations
    for (let i = 0; i < Math.max(swapCount, liqCount); i++) {
      console.log(boxen(chalk.hex('#BA55D3')(`🚀 CYCLE ${i+1}/${Math.max(swapCount, liqCount)}`), { padding: 1 }));
      
      if (i < swapCount) {
        await executeSwapSequence(wallet, address, 1);
      }
      
      if (i < liqCount) {
        await executeLiquiditySequence(wallet, address, 1);
      }

      if (i < Math.max(swapCount, liqCount) - 1) {
        const waitSpinner = ora({
          text: chalk.hex('#00FFFF')(`⏳ Waiting ${delay} minutes...`),
          spinner: 'clock'
        }).start();
        
        await new Promise(resolve => setTimeout(resolve, delay * 60 * 1000));
        waitSpinner.succeed(chalk.green('Resuming operations...'));
      }
    }

    logger.success('✨ ALL OPERATIONS COMPLETED!');
  } catch (error) {
    console.log(
      boxen(
        chalk.red('💀 CRITICAL ERROR 💀\n\n') + 
        error.message,
        { padding: 1, borderColor: 'red' }
      )
    );
  } finally {
    rl.close();
  }
}

// ==============
// START BOT
// ==============
main().catch(console.error);
