export type UserRole = "CLIENT" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthRecord extends AuthUser {
  passwordHash: string;
}

export interface AuthRepository {
  findByEmail(email: string): Promise<AuthRecord | null>;
  createUserWithCart(input: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<AuthUser>;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
}

export interface AuthService {
  register(input: {
    email: string;
    name: string;
    password: string;
  }): Promise<AuthResult>;
  authenticate(email: string, password: string): Promise<AuthResult | null>;
  verifySession(token: string): Promise<AuthUser | null>;
}
