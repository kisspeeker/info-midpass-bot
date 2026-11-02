/** Domain contracts only. No SQL, transport or framework types. */
export type Locale = keyof typeof import('../i18n/constants.js').LANGUAGE_NAMES;
export type Role = 'user' | 'admin';
export type PassportType = 'LEGACY_TYPE' | 'BIOMETRIC';
export interface User {
  telegramUserId: number;
  languageCode: Locale;
  role: Role;
  lastStatusRequestAt?: number | null;
  lastSupportRequestAt?: number | null;
}
export interface Passport {
  uid: string;
  type: PassportType;
  checkedAt: number;
  lastAttemptAt?: number;
  statusText?: string | null;
  sourceUid?: string | null;
  receptionDate?: string | null;
  passportStatusId?: number | null;
  passportStatusName?: string | null;
  passportStatusDescription?: string | null;
  passportStatusColor?: string | null;
  passportStatusSubscription?: boolean | null;
  internalStatusName?: string | null;
  internalStatusPercent?: number | null;
}
export interface Subscription { telegramUserId: number; orderUid: string }
export interface DatabaseStats { users: number; orders: number; subscriptions: number }
export interface UserRepository {
  getById(id: number): Promise<User | null>;
  create(user: Pick<User, 'telegramUserId'> & Partial<Pick<User, 'languageCode'>>): Promise<boolean>;
  update(id: number, values: Partial<Pick<User, 'languageCode' | 'role'>>): Promise<void>;
  saveRole(id: number, role: Role): Promise<void>;
  listByRole(role: Role): Promise<User[]>;
  claimCooldown(input: { id: number; field: 'lastStatusRequestAt' | 'lastSupportRequestAt'; now: number; cutoff: number }): Promise<boolean>;
  remove(id: number): Promise<void>;
}
export interface PassportRepository {
  getById(uid: string): Promise<Passport | null>;
  listSubscribed(): Promise<Passport[]>;
  save(order: Passport): Promise<void>;
  update(uid: string, values: Partial<Passport>): Promise<void>;
  removeStale(input: { uid: string; before: number }): Promise<boolean>;
}
export interface SubscriptionRepository {
  getById(userId: number, uid: string): Promise<Subscription | null>;
  countByUser(userId: number): Promise<number>;
  listByUser(userId: number): Promise<Passport[]>;
  listByPassport(uid: string): Promise<Pick<Subscription, 'telegramUserId'>[]>;
  create(input: { userId: number; order: Passport }): Promise<boolean>;
  remove(userId: number, uid: string): Promise<void>;
}
export interface MaintenanceRepository {
  getStats(): Promise<DatabaseStats>;
  clear(): Promise<DatabaseStats>;
}
export interface Repositories {
  users: UserRepository;
  passports: PassportRepository;
  subscriptions: SubscriptionRepository;
  maintenance: MaintenanceRepository;
}
export interface UserService {
  register(id: number, locale?: Locale): Promise<Locale>;
  getLocale(id: number): Promise<Locale>;
  setLocale(id: number, locale: string): Promise<void>;
  getRole(id: number): Promise<Role>;
  hasRole(id: number, role: Role): Promise<boolean>;
  setRole(id: number, role: Role): Promise<void>;
  admins(): Promise<User[]>;
  remove(id: number): Promise<void>;
  claimStatusRefresh(id: number): Promise<number>;
  claimSupportRequest(id: number): Promise<number>;
}
export type OwnedPassportResult = { status: 'ok'; order: Passport } | { status: 'notFound' | 'applicationNotFound' };
export type PassportResult = OwnedPassportResult
  | { status: 'alreadyTracked' | 'added' | 'refreshed'; order: Passport }
  | { status: 'recent'; order?: Passport }
  | { status: 'removed'; orders: Passport[] }
  | { status: 'limit' | 'fetchFailed' | 'refreshFailed' };
export type FetchPassport = (input: { type: PassportType; uid: string; allowPending?: boolean }) => Promise<Partial<Omit<Passport, 'uid' | 'type' | 'checkedAt' | 'lastAttemptAt'>>>;
export interface PassportService {
  getStatus(userId: number, uid: string): Promise<OwnedPassportResult>;
  list(userId: number): Promise<Passport[]>;
  hasSubscription(userId: number, uid: string): Promise<boolean>;
  track(userId: number, input: { type: PassportType; uid: string }): Promise<PassportResult>;
  refresh(userId: number, input: { uid: string; showStatusOnCooldown?: boolean }): Promise<PassportResult>;
  unsubscribe(userId: number, uid: string): Promise<PassportResult>;
}
export interface PollingSummary { checked: number; changed: number; failed: number; notified: number }
export interface Notifier {
  subscriber(id: number, order: Passport): Promise<'delivered' | 'blocked'>;
}
export interface Logger {
  info(event: string, details?: object): void;
  warn(event: string, details?: object): void;
  error(event: string, error: unknown, details?: object): void;
}
export interface Services {
  users: UserService;
  passports: PassportService;
  maintenance: { getStats(): Promise<DatabaseStats> };
  support: { request(userId: number): Promise<{ status: 'retry'; retryAfter: number } | { status: 'ready'; admins: User[] }> };
}
export interface I18n {
  locale: Locale;
  t(key: string, params?: unknown): string;
  passportLabel(type: PassportType): string;
  passportPrompt(type: PassportType): string;
}

/** The public adapter preserves method parameters and returns Promises. */
export type AsyncRepository<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? (...args: A) => Promise<Awaited<R>> : never;
};
