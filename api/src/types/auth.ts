export type VerifiedCredential = {
  address: string;
  chain: string;
  id: string;
  name_service: unknown;
  public_identifier: string;
  wallet_name: string;
  wallet_provider: string;
  format: string;
};

export type User = {
  userId: string;
  kid: string;
  aud: string;
  iss: string;
  sub: string;
  sid: string;
  email: string;
  environment_id: string;
  lists: unknown[];
  missing_fields: unknown[];
  verified_credentials: VerifiedCredential[];
};

export type RawRequestWithUser = {
  user: User;
};