import type { Role } from "../../config/constants";

export interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  countryCode?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: {
    id: string;
    email: string;
    name: string;
    roles: Role[];
  };
}
