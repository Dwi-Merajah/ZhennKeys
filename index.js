require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { makeDiscordBot, msgs, Scandir } = require('./lib/serialize');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  AudioPlayerStatus,
  StreamType
} = require('@discordjs/voice');
const prism = require('prism-media');
const env = require('./config.json');
const machine = new (require('./lib/database/localdb'))(env.database);
const handler = require('./handler');

async function init() {
  global.db = {
    users: [],
    chats: [],
    groups: [],
    redeem: {},
    menfess: {},
    statistic: {},
    sticker: {},
    msgs: {},
    setting: {},
    ...(await machine.fetch() || {})
  };

  await machine.save(global.db);
  setInterval(async () => {
    if (global.db) await machine.save(global.db);
  }, 30 * 1000);

  const loadPlugins = async () => {
    const files = await Scandir(process.cwd() + '/plugins');
    const plugins = Object.fromEntries(
      files
        .filter(v => v.endsWith('.js'))
        .map(file => [path.basename(file, '.js'), require(path.resolve(process.cwd() + '/plugins', file))])
    );
    global.plugins = plugins;
  };

  await loadPlugins();

  const client = makeDiscordBot(process.env.TOKEN);
  console.log("connected");

  client.on('messageCreate', async (message) => {
    const m = msgs(client, message);
    await handler(client, m, env);
  });
}

init().catch(err => console.error(err));