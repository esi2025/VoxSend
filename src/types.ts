export interface AliasEntry {
  id: string;
  alias: string;
  phoneNumber: string;
  predefinedMessage: string;
  defaultPrefix?: string;
  createdAt: number;
  updatedAt: number;
}

export enum SmsStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  FAILED = 'FAILED',
  DELIVERED = 'DELIVERED'
}

export interface SmsLog {
  id: string;
  timestamp: number;
  alias: string;
  maskedPhone: string;
  messagePreview: string;
  status: SmsStatus;
  failureReason?: string;
}
