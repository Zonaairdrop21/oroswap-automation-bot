# ZigChain Trading Bot - Enhanced Version

Bot trading otomatis untuk Oroswap di ZigChain testnet dengan dukungan token baru: STZIG, DYOR, dan BEE.

## 🚀 Fitur Utama

- **Swap Bidirectional**: ZIG ↔ STZIG, ZIG ↔ DYOR, ZIG ↔ BEE
- **Add Liquidity**: Dukungan untuk semua 6 pasangan token
- **Auto Trading**: Swap otomatis dengan delay random
- **Multi Wallet**: Support untuk beberapa wallet sekaligus

## 📦 Token yang Didukung

| Token | Pasangan | Contract Address |
|-------|----------|------------------|
| ORO | ORO/ZIG | zig15jqg0hmp9n06q0as7uk3x9xkwr9k3r7yh4ww2uc0hek8zlryrgmsamk4qg |
| NFA | NFA/ZIG | zig1dye3zfsn83jmnxqdplkfmelyszhkve9ae6jfxf5mzgqnuylr0sdq8ng9tv |
| CULTCOIN | CULTCOIN/ZIG | zig1j55nw46crxkm03fjdf3cqx3py5cd32jny685x9c3gftfdt2xlvjs63znce |
| **STZIG** | **STZIG/ZIG** | **zig19zqxslng99gw98ku3dyqaqy0c809kwssw7nzhea9x40jwxjugqvs5xaghj** |
| **DYOR** | **DYOR/ZIG** | **zig1us8t6pklp2v2pjqnnedg9wnp3pv50kl448csv0lsuad599ef56jsyvakl9** |
| **BEE** | **BEE/ZIG** | **zig1r50m5lafnmctat4xpvwdpzqndynlxt2skhr4fhzh76u0qar2y9hqu74u5h** |

## 🛠️ Instalasi

1. **Download Files**:
   - `index.mjs`
   - `package-updated.json` (rename ke `package.json`)
   - `.env.example` (copy ke `.env`)

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Setup Environment**:
   ```bash
   cp .env.example .env
   # Edit .env file dengan private key atau mnemonic Anda
   ```

4. **Run Application**:
   ```bash
   npm start
   # atau
   node index.mjs
   ```

## ⚙️ Konfigurasi .env

```env
PRIVATE_KEY_OR_MNEMONIC=your_private_key_or_mnemonic_here
```

## 🎯 Cara Menggunakan

1. Jalankan aplikasi
2. Masukkan private key atau mnemonic phrase
3. Pilih menu:
   - **Swap Tokens**: Otomatis swap semua token (bolak-balik)
   - **Add Liquidity**: Tambah likuiditas untuk semua pasangan
   - **Multi Wallet**: Jalankan untuk beberapa wallet

## 🔧 Requirements

- Node.js v16 atau lebih baru
- Internet connection untuk akses ZigChain testnet
- Private key atau mnemonic phrase wallet ZigChain

## 🌐 Network Info

- **RPC**: https://testnet-rpc.zigchain.com
- **API**: https://testnet-api.zigchain.com
- **Explorer**: https://zigscan.org/tx/

## ⚠️ Important Notes

- Aplikasi menggunakan ES modules (`.mjs` extension)
- Gas price: 0.026uzig
- Testnet only - jangan gunakan di mainnet
- Simpan private key dengan aman

## 🆕 Update Terbaru

- ✅ Tambah token STZIG, DYOR, BEE
- ✅ Swap bidirectional untuk semua token baru
- ✅ Liquidity provision untuk semua pasangan
- ✅ Fix ES module compatibility