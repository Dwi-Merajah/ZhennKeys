const Func = require('./lib/functions');
const path = require('path');
require("./lib/config.js")
const cron = require('node-cron')

module.exports = async (client, m, env) => {
    const body = m.text || ''
    let getPrefix = body ? body.charAt(0) : ''
    let isPrefix = (env.setting.multiprefix ? env.setting.prefix.includes(getPrefix) : env.setting.onlyprefix == getPrefix) ? getPrefix : undefined
    require('./lib/database/schema')(m)

    const groupSet = global.db.groups.find(v => v.jid === m.chat)
    const chats = global.db.chats.find(v => v.jid === m.chat)
    const users = global.db.users.find(v => v.jid === m.sender)
    let setting = global.db.setting

    let isROwner = [env.OWNER_ID, ...(setting.owners || [])].filter(Boolean).includes(m.sender);
    let isPrem = users && users.premium || isROwner

    if (!users || typeof users.limit === undefined) {
        return global.db.users.push({
            jid: m.sender,
            banned: false,
            limit: env.limit,
            hit: 0,
            spam: 0
        })
    }

    if (m.isGroup) groupSet.activity = new Date() * 1
    if (users) users.lastseen = new Date() * 1
    if (chats) {
        chats.chat += 1
        chats.lastseen = new Date() * 1
    }

    if (m.isGroup && users && users.afk > -1) {
        m.reply(`Kamu kembali online setelah AFK selama : ${Func.toTime(new Date - users.afk)}\n\n• Alasan: ${users.afkReason || '-'}`)
        users.afk = -1
        users.afkReason = ''
    }

    cron.schedule('00 00 * * *', () => {
        setting.lastReset = new Date() * 1
        global.db.users.filter(v => v.limit < env.limit && !v.premium).map(v => v.limit = env.limit)
        Object.entries(global.db.statistic).map(([_, prop]) => prop.today = 0)
    }, {
        scheduled: true,
        timezone: "Asia/Makassar"
    })

    const commands = Func.arrayJoin(Object.values(Object.fromEntries(Object.entries(global.plugins).filter(([_, prop]) => prop.run.usage))).map(v => v.run.usage)).concat(
        Func.arrayJoin(Object.values(Object.fromEntries(Object.entries(global.plugins).filter(([_, prop]) => prop.run.hidden))).map(v => v.run.hidden))
    )

    const args = body && body.replace(isPrefix, '').split(' ').filter(v => v !== '')
    const command = args.length > 0 ? args.shift().toLowerCase() : ''
    const clean = body && body.replace(isPrefix, '').trim().split` `.slice(1)
    const text = clean ? clean.join` ` : undefined

    require('./lib/print')(command, m, client)

    if (body && isPrefix && commands.includes(command) ||
        body && !isPrefix && commands.includes(command) && setting.noprefix ||
        body && !isPrefix && commands.includes(command) && env.evaluate_chars.includes(command)) {

        const is_commands = Object.fromEntries(Object.entries(global.plugins).filter(([_, prop]) => prop.run.usage))
        for (let name in is_commands) {
            let cmd = is_commands[name].run
            let turn = Array.isArray(cmd.usage) ? cmd.usage.includes(command) : cmd.usage === command
            let turn_hidden = Array.isArray(cmd.hidden) ? cmd.hidden.includes(command) : cmd.hidden === command

            if (!turn && !turn_hidden) continue
            if (cmd.limit && users.limit < 1) {
                m.reply(`⚠️ Batas limit kamu habis. Limit akan direset pukul 00.00 WITA.`)
                continue
            }
            if (cmd.limit && users.limit > 0) {
                const limit = typeof cmd.limit === 'boolean' ? 1 : cmd.limit
                if (users.limit >= limit) {
                    users.limit -= limit
                } else {
                    m.reply(`⚠️ Limit kamu tidak cukup untuk memakai fitur ini.`)
                    continue
                }
            }
            if (cmd.owner && !isROwner) {
                m.reply(global.status.owner)
                continue
            }
            if (cmd.private && m.isGroup) {
                m.reply(global.status.private)
                continue
            }
            if (cmd.premium && !isPrem) {
                m.reply(global.status.premium)
                continue
            }
            if (cmd.group && !m.isGroup) {
                m.reply("Perintah ini hanya untuk grup.")
                continue
            }
            await cmd.async(m, {
                client,
                args,
                Scraper,
                text,
                users,
                Func,
                Api,
                isPrefix,
                env,
                isROwner,
                command,
                plugins: global.plugins
            })
            break
        }
    } else {
        const is_events = Object.fromEntries(Object.entries(global.plugins).filter(([_, prop]) => !prop.run.usage))
        for (let name in is_events) {
            let event = is_events[name].run
            event.async(m, {
                client,
                args,
                text,
                users,
                env,
                Api,
                Scraper,
                body,
                isROwner,
                Func,
                isPrefix,
                command,
                plugins: global.plugins
            })
        }
    }
}
