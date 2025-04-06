const {
  Client,
  GatewayIntentBits,
  Partials,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const path = require("path");
const axios = require("axios");
const { readdir, stat } = require("fs").promises;
const { resolve, basename } = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const isProtected = (filepath) => {
  const normalized = path.normalize(filepath);
  const cwd = process.cwd();
  return (
    normalized === cwd ||
    normalized.startsWith(path.join(cwd, 'media')) ||
    normalized.endsWith('cover.jpg')
  );
};

exports.makeDiscordBot = (token, options = {}) => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMembers
    ],
    partials: [
      Partials.Channel,
      Partials.Message,
      Partials.User,
      Partials.GuildMember
    ]
  });

  client.login(token);


  client.reply = async (channel, text, msg) => {
  const MAX_LENGTH = 4000;

  if (text.length > MAX_LENGTH) {
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const filePath = path.join(tempDir, `message_${Date.now()}.txt`);
    fs.writeFileSync(filePath, text);

    const options = {
      files: [{
        attachment: filePath,
        name: "message.txt",
      }],
      content: "Pesan terlalu panjang, dikirim sebagai file.",
    };

    if (msg) options.reply = { messageReference: msg.id };

    const sent = await channel.send(options);
    fs.unlinkSync(filePath); // hapus setelah terkirim
    return sent;
  } else {
    const options = { content: text };
    if (msg) options.reply = { messageReference: msg.id };
    return channel.send(options);
   }
  };
  client.sendFile = async (channel, source, filename = "", caption = "", msg, artist = "Unknown Artist") => {
  const fileData = await Func.getFile(source);
  if (!fileData.status) return client.reply(channel, "Gagal mengambil file.", msg);

  const { file, extension, headers } = fileData;
  let originalFilename = "file." + extension;

  if (headers?.["content-disposition"]) {
    const match = headers["content-disposition"].match(/filename=(["']?)(.+?)\1$/);
    if (match) originalFilename = decodeURIComponent(match[2]);
  }

  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const cleanTitle = (filename || originalFilename).replace(/\.[^/.]+$/, "");
  let finalFile = file;
  let tempOutput;

  if (["mp3", "wav", "ogg", "flac", "mpga"].includes(extension)) {
    tempOutput = path.join(tempDir, `${Date.now()}_${originalFilename}`);
    try {
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -i "${file}" -metadata artist="${artist}" -metadata title="${cleanTitle}" -codec copy "${tempOutput}"`,
          { stdio: "ignore" },
          err => (err ? reject(err) : resolve())
        );
      });
      finalFile = tempOutput;
    } catch {
      fs.copyFileSync(file, tempOutput);
      finalFile = tempOutput;
    }
  }

  const attachment = new AttachmentBuilder(finalFile, {
    name: path.basename(filename || originalFilename)
  });

  const result = await channel.send({
    content: caption,
    files: [attachment],
    reply: msg?.id ? { messageReference: msg.id } : undefined
  });

  if (tempOutput && fs.existsSync(tempOutput) && !isProtected(tempOutput)) {
    fs.unlinkSync(tempOutput);
  }

  if (fs.existsSync(file) && !isProtected(file)) {
    fs.unlinkSync(file);
  }
 
   return result;
  };

  return client;
};

exports.msgs = (client, msg) => {
  if (!msg) return msg;

  const m = {
    msg: msg,
    id: msg.id,
    chat: msg.channel,
    isGroup: msg.channel.type !== 1,
    sender: msg.author.id,
    name: msg.author.username || "",
    username: msg.author.tag || "",
    text: msg.content || "",
    quoted: msg.reference ? exports.msgs(client, msg.reference.message) : null,
    groupName: msg.guild?.name || null,
    type: msg.attachments.size ? msg.attachments.first().contentType?.split("/")[0] : "text"
  };

  m.reply = (text) => client.reply(m.chat, text, msg);

  m.download = async () => {
    if (!msg.attachments.size) return null;
    const attachment = msg.attachments.first();
    const response = await axios.get(attachment.url, { responseType: "arraybuffer" });
    return response.data;
  };

  return m;
};

exports.Scandir = async (dir) => {
  let subdirs = await readdir(dir);
  let files = await Promise.all(
    subdirs.map(async (subdir) => {
      let res = resolve(dir, subdir);
      return (await stat(res)).isDirectory() ? exports.Scandir(res) : res;
    })
  );
  return files.flat();
};