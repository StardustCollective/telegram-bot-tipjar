'use strict'

const FireDB = require('../providers/firebase')
const Telegram = require('../providers/telegram')

const DEFAULT_MENU = [[{ text: '👛 Balance' }, { text: '🏦 Deposit' }], [{ text: '🦮 Withdraw' }, { text: '🆘 Help' }]]

const handleStart = async function (tgUserID, tgUsername) {

    // TODO: check if user exists, do nothing? throw error?

    // TODO: create DAG wallet? Or do we do this when user has read and accept disclaimer, when trying to deposit?
    // const wallet_id = await DAG.createWallet()
    const wallet_id = "1771c2398b334594b34d362d23fba099"

    await FireDB.collection("users").doc(`${tgUserID}`).set({
        username: tgUsername,
        wallet_id,
        created_at: new Date(),
        updated_at: new Date()
    })

    await Telegram.sendKeyboard(tgUserID, `Welcome to Stargazer Wallet! See /help for more information on how to use. Your wallet ID is ${wallet_id}`, DEFAULT_MENU)
}

const handleHelp = async function (tgUserID) {
    const options = [[{ text: 'Support' }, { text: 'Disclaimer' }, { text: 'Cancel' }]]
    await Telegram.sendKeyboard(tgUserID, 'Choose help command', options)
}

const handleCancel = async function (tgUserID) {
    await Telegram.sendKeyboard(tgUserID, '_', DEFAULT_MENU) // FIXME: should we send a message here?
}

// TODO:
const handleBalance = async function(tgUserID) {
    await Telegram.sendKeyboard(tgUserID, '💩💩💩💩', DEFAULT_MENU)
}

// TODO:
const handleDeposit = async function(tgUserID) {
    await Telegram.sendKeyboard(tgUserID, 'stub-stub', DEFAULT_MENU)
}

// TODO:
const handleWithdrawal = async function(tgUserID) {
    await Telegram.sendKeyboard(tgUserID, 'stub-stub', DEFAULT_MENU)
}

module.exports = {
    handleStart,
    handleHelp,
    handleCancel,
    handleBalance,
    handleDeposit,
    handleWithdrawal
}
