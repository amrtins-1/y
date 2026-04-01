export enum ConsultationConflictStatus {
  AMEACA = 'AMEACA',
  INVADIDA_PARCIAL = 'INVADIDA_PARCIAL',
  INVADIDA_TOTAL = 'INVADIDA_TOTAL',
  PROCESSO = 'PROCESSO',
  OUTROS = 'OUTROS',
}

export enum DonationFrequency {
  ONE_TIME = 'ONE_TIME',
  MONTHLY = 'MONTHLY',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELED = 'CANCELED',
}

export enum QuoteDirection {
  UP = 'UP',
  DOWN = 'DOWN',
  EQUAL = 'EQUAL',
  UNKNOWN = 'UNKNOWN',
}

export enum SubscriptionStatus {
  TRIALING = 'TRIALING',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

export enum TicketStatus {
  NOVO = 'NOVO',
  EM_ANALISE = 'EM_ANALISE',
  RESPONDIDO = 'RESPONDIDO',
  ENCERRADO = 'ENCERRADO',
}

export enum UserRole {
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
}
