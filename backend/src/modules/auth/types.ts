export interface TelegramAuthUser {
  telegramId: bigint;
  name: string;
  username: string | null;
}

export interface ValidatedInitData {
  authDate: number;
  user: TelegramAuthUser;
}
