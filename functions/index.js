'use strict'

const FirebaseFunctions = require('firebase-functions');

const Webhook = require('./handlers/webhook')

exports.handleUpdate = FirebaseFunctions.https.onRequest(async (request, response) => {

    // TODO: payload validation.
    console.log(JSON.stringify(request.body))

    if (!request.body.message) return response.status(200).send()

    const tgUserID = request.body.message.from.id
    const tgUsername = request.body.message.from.username

    try {
        switch (request.body.message.text) {
            case '/start':
                await Webhook.handleStart(tgUserID, tgUsername); break;
            case '/balance':
            case '👛 Balance':
                await Webhook.handleBalance(tgUserID, tgUsername); break;
            case '/deposit':
            case '🏦 Deposit':
                await Webhook.handleDeposit(tgUserID, tgUsername); break;
            case '/withdraw':
            case '🦮 Withdraw':
                await Webhook.handleWithdrawal(tgUserID, tgUsername); break;
            case '/help':
            case '🆘 Help':
                await Webhook.handleHelp(tgUserID, tgUsername); break;
            case 'Cancel':
                await Webhook.handleCancel(tgUserID, tgUsername); break;
            default:
                return response.status(200).send() // TODO: should we do something here?
        }

        return response.status(200).send()

    } catch (ex) {
        console.error(ex)
        return response.status(500).send(ex.message)
    }
})
