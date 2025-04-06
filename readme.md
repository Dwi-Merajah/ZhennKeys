# Zhen Discord Bot - Cara Memakai dari Awal

Bot ini dibangun dengan `discord.js`, mendukung sistem modular plugin, database lokal, serta utilitas canggih seperti pengiriman file dan tombol interaktif.

## Buat Bot di Discord Developer Portal

1. Kunjungi [https://discord.com/developers/applications](https://discord.com/developers/applications)
2. Klik **"New Application"**, beri nama bot kamu
3. Masuk ke tab **"Bot"** → Klik **"Add Bot"**
4. Aktifkan opsi:
   - `MESSAGE CONTENT INTENT`
   - `PRESENCE INTENT` (opsional)
   - `SERVER MEMBERS INTENT`
5. Salin **Token Bot**

## Invite Bot ke Server

Buka tab **OAuth2 > URL Generator**, pilih:
- `bot`
- `applications.commands`

Lalu beri permission minimal:
- `Send Messages`
- `Attach Files`
- `Read Message History`

Salin URL, buka di browser, dan invite bot ke server kamu.

## ✨ Fitur

- Sistem plugin modular (folder `plugins/`)
- Kirim file/media dengan caption
- Sistem user & grup (auto register)
- Audio metadata dengan FFmpeg
- Reply gaya WhatsApp/Telegram (`m.reply`)
- Database lokal (`.json`)
- Sistem limit, premium, dan owner

## ⚙️ Instalasi

### 1. Clone & install dependencies

git clone https://github.com/Dwi-Merajah/ZhennKeys
cd ZhennKeys
npm install

### 2. Konfigurasi .env

Buat file .env di root:

TOKEN=YOUR_DISCORD_BOT_TOKEN

### 3. Konfigurasi config.json

{
  "OWNER_ID": "123456789012345678",
  "limit": 20,
  "database": "database.json"
}

OWNER_ID: ID Discord kamu (bisa pakai message.author.id)

limit: Limit default user

database: Path ke file database lokal


✏️ Contoh Plugin

Buat file plugins/hello.js:

```bash
exports.zhen = {
  usage: ['hello'],
  category: 'fun',
  async: async (m) => {
    m.reply('Halo dari plugin!')
  },
  limit: false,
  premium: false
}
```

❓ Cara Mendapatkan ID Owner

Di Discord, klik kanan pada nama kamu > Copy User ID
(aktifkan "Developer Mode" dulu di pengaturan > Advanced)

