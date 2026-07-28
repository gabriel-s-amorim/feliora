export type StoreSettings = {
  contactEmail: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  addressLine: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  twitterUrl: string;
  updatedAt: string;
};

export type StoreSettingsInput = {
  contactEmail: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  addressLine: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  twitterUrl: string;
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  contactEmail: "",
  whatsappNumber: "",
  whatsappDisplay: "",
  addressLine: "",
  instagramUrl: "",
  facebookUrl: "",
  tiktokUrl: "",
  twitterUrl: "",
  updatedAt: new Date(0).toISOString(),
};
