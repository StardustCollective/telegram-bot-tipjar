
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
