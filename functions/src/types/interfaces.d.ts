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
    is_anonymous: boolean;
    custom_title?: string;
}
interface ChatMemberAdministrator {
    status: "administrator";
    user: any;
    is_anonymous: boolean;
    custom_title?: string;
    can_be_edited: boolean;
    can_change_info: boolean;
    can_post_messages: boolean;
    can_edit_messages: boolean;
    can_delete_messages: boolean;
    can_invite_users: boolean;
    can_restrict_members: boolean;
    can_pin_messages: boolean;
    can_promote_members: boolean;
    can_manage_voice_chats: boolean;
    can_manage_chat: boolean;
}
interface ChatMemberMember {
    status: "member";
    user: any;
}
interface ChatMemberRestricted {
    status: "restricted";
    user: any;
    until_date: number;
    is_member: boolean;
    can_change_info: boolean;
    can_send_messages: boolean;
    can_send_media_messages: boolean;
    can_invite_users: boolean;
    can_pin_messages: boolean;
    can_send_polls: boolean;
    can_send_other_messages: boolean;
    can_add_web_page_previews: boolean;
}
interface ChatMemberLeft {
    status: "left";
    user: any;
}
interface ChatMemberBanned {
    status: "kicked";
    user: any;
    until_date: number;
}

type ChatMember = ChatMemberAdministrator | ChatMemberOwner | ChatMemberMember | ChatMemberRestricted | ChatMemberLeft | ChatMemberBanned;

interface TranslatedKeyboardStrings {
    translatedBalance: string,
    translatedHelp: string,
    translatedDeposit: string,
    translatedWithdraw: string
}

type DbLanguage = {
    language: string
}
