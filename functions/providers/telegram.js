'use strict'

const Fetch = require('node-fetch')
const FirebaseFunctions = require('firebase-functions');
const TG_BOT_TOKEN = FirebaseFunctions.config().telegram.bot_token

const callTelegram = async function (command, method, body, headers) {
    const response = await Fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/${command}`, { method, headers, body })
    const result = await response.json()
    if (!result.ok) throw new Error('not ok')
    return result.result
}

const sendText = async function (chat_id, text) {
    return await callTelegram('sendmessage', 'post', JSON.stringify({
        chat_id,
        text
    }), { 'Content-Type': 'application/json' })
}

const sendKeyboard = async function (chat_id, text, keyboard) {
    return await callTelegram('sendmessage', 'post', JSON.stringify({
        chat_id,
        text,
        reply_markup: {
            keyboard: keyboard,
            one_time_keyboard: false,
            resize_keyboard: true
        }
    }), { 'Content-Type': 'application/json' })
}

module.exports = {
    sendText,
    sendKeyboard
}
