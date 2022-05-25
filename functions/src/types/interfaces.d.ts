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
    sourceChatId: string
    sourceUsername: string
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
interface ChatMemberOwner {
    status: "creator";
    user: any;
    isAnonymous: boolean;
    customTitle?: string;
}
interface ChatMemberAdministrator {
    status: "administrator";
    user: any;
    isAnonymous: boolean;
    customTitle?: string;
    canBeEdited: boolean;
    canChangeInfo: boolean;
    canPostMessages: boolean;
    canEditMessages: boolean;
    canDeleteMessages: boolean;
    canInviteUsers: boolean;
    canRestrictMembers: boolean;
    canPinMessages: boolean;
    canPromoteMembers: boolean;
    canManageVoiceChats: boolean;
    canManageChat: boolean;
}
interface ChatMemberMember {
    status: "member";
    user: any;
}
interface ChatMemberRestricted {
    status: "restricted";
    user: any;
    untilDate: number;
    isMember: boolean;
    canChangeInfo: boolean;
    canSendMessages: boolean;
    canSendMediaMssages: boolean;
    canInviteUsers: boolean;
    canPinMessages: boolean;
    canSendPolls: boolean;
    canSendOtherMessages: boolean;
    canAddWebPagePreviews: boolean;
}
interface ChatMemberLeft {
    status: "left";
    user: any;
}
interface ChatMemberBanned {
    status: "kicked";
    user: any;
    untilDate: number;
}

type ChatMember = ChatMemberAdministrator |
        ChatMemberOwner |
        ChatMemberMember |
        ChatMemberRestricted |
        ChatMemberLeft |
        ChatMemberBanned;

interface TranslatedKeyboardStrings {
    translatedBalance: string,
    translatedHelp: string,
    translatedDeposit: string,
    translatedWithdraw: string
}

type DbLanguage = {
    language: string
}
