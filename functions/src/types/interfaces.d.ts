
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

interface WithdrawalState extends State {
    balance: number,
    amount?: number,
    destinationAddress?: string
}
