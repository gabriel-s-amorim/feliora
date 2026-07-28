export type MelhorEnvioEnvironment = "production" | "sandbox";

/** Status seguro para o admin (sem secrets/tokens). */
export interface MelhorEnvioStatus {
  environment: MelhorEnvioEnvironment;
  redirectUri: string;
  userAgent: string;
  originPostalCode: string;
  defaultWidthCm: number;
  defaultHeightCm: number;
  defaultLengthCm: number;
  defaultWeightKg: number;
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderDocumentType: "cpf" | "cnpj";
  senderDocument: string;
  senderStateRegister: string;
  senderAddress: string;
  senderNumber: string;
  senderComplement: string;
  senderDistrict: string;
  senderCity: string;
  senderStateAbbr: string;
  clientId: string;
  hasClientSecret: boolean;
  connected: boolean;
  tokenExpiresAt: string | null;
  productionConfigured: boolean;
  sandboxConfigured: boolean;
  productionConnected: boolean;
  sandboxConnected: boolean;
}

export interface MelhorEnvioSettingsInput {
  environment?: MelhorEnvioEnvironment;
  redirectUri?: string;
  userAgent?: string;
  originPostalCode?: string;
  defaultWidthCm?: number;
  defaultHeightCm?: number;
  defaultLengthCm?: number;
  defaultWeightKg?: number;
  freeShippingEnabled?: boolean;
  freeShippingThreshold?: number;
  senderName?: string;
  senderEmail?: string;
  senderPhone?: string;
  senderDocumentType?: "cpf" | "cnpj";
  senderDocument?: string;
  senderStateRegister?: string;
  senderAddress?: string;
  senderNumber?: string;
  senderComplement?: string;
  senderDistrict?: string;
  senderCity?: string;
  senderStateAbbr?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface ShippingQuotePackage {
  height: number;
  width: number;
  length: number;
  weight: number;
}

export interface ShippingQuoteOption {
  id: string;
  name: string;
  company: string;
  price: number;
  customPrice: number;
  deliveryTime: number;
  customDeliveryTime: number;
  currency: string;
  companyId?: number | null;
  packages: ShippingQuotePackage[];
  error?: string | null;
}

export interface ShippingQuoteResult {
  quoteId?: string;
  expiresAt?: string;
  options: ShippingQuoteOption[];
  environment: MelhorEnvioEnvironment;
  freeShippingApplied: boolean;
}
