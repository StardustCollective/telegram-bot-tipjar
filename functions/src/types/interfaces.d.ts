
interface Wallet {
    privateKey: string,
    address: string,
    fullAddress: string,
}

interface UserSchema {
    username: string,
    wallet?: Wallet,
    acceptedDisclaimerTS: number,
    createdTS: number,
    updatedTS: number
}

interface State {
    path: string,
    section: string
}

interface TipState extends State {
    amount?: number,
    destinationAddress?: string
    destinationUser?: string
}

interface WithdrawalState extends State {
    amount?: number,
    destinationAddress?: string
}

interface TelegramKeyboardButtonInt {
    text: string,
    // TG API needs like this, so ignore eslint.
    // eslint-disable-next-line camelcase
    callback_data?: string,
}

type TelegramKeyboardButton = Array<TelegramKeyboardButtonInt>
interface TelegramKeyboard {
    inline: boolean,
    keys: Array<TelegramKeyboardButton>
}

interface TelegramResponse {
    ok: boolean,
    result: string
}
