# 👴 Sesepuh Bot v1 – Fun Pack (Circle Edition)

Bot Discord untuk komunitas kecil yang aktif, dengan fitur Sesepuh Power yang fun dan interaktif.

## ✨ Fitur

| Command | Deskripsi | Permission |
|---|---|---|
| `/bless @user [durasi]` | Berikan role buff sementara | Sesepuh only |
| `/curse @user [durasi]` | Timeout/mute member nakal | Sesepuh only |
| `/summon [vc]` | Panggil semua ke VC via DM | Sesepuh only |
| `/roast @user` | Roast seseorang gaya Sesepuh | Semua |
| `/praise @user` | Puji seseorang dengan restu Sesepuh | Semua |
| `/spin [@user]` | Spin roda tantangan random | Semua |
| `/team [jumlah]` | Generate tim acak dari VC/online | Semua |

---

## 🚀 Setup

### 1. Buat Discord Application

1. Buka [Discord Developer Portal](https://discord.com/developers/applications)
2. Klik **New Application** → beri nama "Sesepuh Bot"
3. Pergi ke tab **Bot** → klik **Add Bot**
4. Di bagian **Token** → klik **Reset Token** → copy token
5. Di bagian **Privileged Gateway Intents**, aktifkan:
   - ✅ **Server Members Intent**
   - ✅ **Presence Intent**
6. Pergi ke tab **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Manage Roles`, `Moderate Members`, `Send Messages`, `Embed Links`
7. Copy URL yang generated → buka di browser → invite ke servermu

### 2. Install & Setup Project

```bash
# Clone atau download project
git clone <repo-url>
cd sesepuh-bot

# Install dependencies
npm install

# Copy env file
cp .env.example .env
```

### 3. Isi `.env`

```env
DISCORD_TOKEN=token_bot_kamu_dari_developer_portal
CLIENT_ID=application_id_dari_developer_portal  # General Information > Application ID
GUILD_ID=id_server_discord_kamu               # Klik kanan server → Copy Server ID

# Optional tapi recommended:
SESEPUH_ROLE_ID=id_role_sesepuh              # Role yang bisa pakai /bless /curse /summon
BLESS_ROLE_ID=id_role_untuk_buff            # Role yang dikasih saat /bless
LOG_CHANNEL_ID=id_channel_untuk_log         # Channel untuk log semua aksi Sesepuh
```

> **Cara dapat ID:** Aktifkan Developer Mode di Discord (Settings → Advanced → Developer Mode), lalu klik kanan pada server/channel/role → Copy ID

### 4. Deploy Slash Commands

```bash
npm run deploy
```

Output yang benar:
```
✅ Successfully registered 7 commands to Guild: xxxxxxxxxx
  /bless — Berikan buff/role sementara kepada member
  /curse — Timeout/mute member nakal
  /summon — Panggil semua member ke Voice Channel
  /roast — Roast seseorang dengan gaya Sesepuh
  /praise — Puji seseorang dengan restu Sesepuh
  /spin — Putar roda tantangan Sesepuh!
  /team — Generate tim secara acak
```

### 5. Jalankan Bot

```bash
# Development (auto-restart on save)
npm run watch

# Production
npm run build
npm start
```

---

## ⚙️ Konfigurasi Role

### Setup Role Sesepuh

1. Buat role "Sesepuh" di servermu
2. Assign role ke admin/moderator
3. Copy Role ID → paste ke `SESEPUH_ROLE_ID` di `.env`
4. Kalau `SESEPUH_ROLE_ID` tidak diset, hanya **Administrator** yang bisa pakai `/bless`, `/curse`, `/summon`

### Setup Role Bless (Buff)

1. Buat role "✨ Blessed" di servermu
2. Kasih role ini warna/permissions menarik (misal: bisa pakai emoji eksklusif)
3. **PENTING:** Pastikan role ini berada **di bawah** role bot di hierarchy
4. Copy Role ID → paste ke `BLESS_ROLE_ID` di `.env`

---

## 🚢 Deployment ke Railway (Gratis)

1. Push code ke GitHub
2. Buka [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Pilih repo → set minimal `DISCORD_TOKEN` di Railway dashboard
4. Kalau slash command belum pernah diregister, tambahkan juga `CLIENT_ID` dan `GUILD_ID`, lalu jalankan `npm run deploy` sekali
5. Jangan override start command ke `npm run build && npm start` kalau `nixpacks.toml` dipakai
6. Biarkan Railway build dengan `npm run build`, lalu start dengan `node dist/index.js`
7. Done! Bot akan online 24/7

---

## 📁 Struktur Project

```
sesepuh-bot/
├── src/
│   ├── commands/
│   │   ├── index.ts       # Command registry
│   │   ├── bless.ts       # /bless command
│   │   ├── curse.ts       # /curse command
│   │   ├── summon.ts      # /summon command
│   │   ├── roast.ts       # /roast & /praise commands
│   │   └── fun.ts         # /spin & /team commands
│   ├── events/
│   │   ├── ready.ts       # Bot ready event
│   │   └── interactionCreate.ts  # Slash command handler
│   ├── utils/
│   │   ├── database.ts    # SQLite setup & queries
│   │   ├── helpers.ts     # Utility functions
│   │   ├── buffManager.ts # Auto-expire buff scheduler
│   │   └── types.ts       # TypeScript interfaces
│   ├── index.ts           # Main entry point
│   └── deploy-commands.ts # Slash command deployer
├── data/
│   └── sesepuh.db         # SQLite database (auto-created)
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🔧 Troubleshooting

| Error | Solusi |
|---|---|
| `Missing Permissions` | Pastikan bot punya role dengan permission yang dibutuhkan |
| `Role position` error | Pindahkan role Bot ke posisi lebih tinggi dari role Bless |
| Command tidak muncul | Jalankan `npm run deploy` lagi |
| Bot tidak respond | Cek token di `.env` sudah benar |
| DM gagal terkirim | Normal — member mungkin disable DM dari server |
