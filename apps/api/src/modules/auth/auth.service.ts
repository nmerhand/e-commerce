import argon2 from "argon2";
import { errors, jwtVerify, SignJWT } from "jose";
import { EmailAlreadyRegisteredError } from "./auth.errors";
import type {
  AuthRepository,
  AuthResult,
  AuthService,
  AuthUser,
} from "./auth.types";

const sessionDuration = "30m";
const sessionIssuer = "ecommerce-api";
const sessionAudience = "ecommerce-web";

export function createAuthService(
  repository: AuthRepository,
  sessionSecret: string,
): AuthService {
  if (Buffer.byteLength(sessionSecret) < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 bytes");
  }

  const key = new TextEncoder().encode(sessionSecret);

  async function createToken(user: AuthUser) {
    return new SignJWT({
      email: user.email,
      name: user.name,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuer(sessionIssuer)
      .setAudience(sessionAudience)
      .setIssuedAt()
      .setExpirationTime(sessionDuration)
      .sign(key);
  }

  async function resultFor(user: AuthUser): Promise<AuthResult> {
    return { user, token: await createToken(user) };
  }

  return {
    async register(input) {
      const email = input.email.trim().toLowerCase();

      if (await repository.findByEmail(email)) {
        throw new EmailAlreadyRegisteredError();
      }

      const passwordHash = await argon2.hash(input.password, {
        type: argon2.argon2id,
      });
      const user = await repository.createUserWithCart({
        email,
        name: input.name.trim(),
        passwordHash,
      });

      return resultFor(user);
    },
    async authenticate(emailInput, password) {
      const email = emailInput.trim().toLowerCase();
      const user = await repository.findByEmail(email);

      if (!user || !(await argon2.verify(user.passwordHash, password))) {
        return null;
      }

      return resultFor({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    },
    async verifySession(token) {
      let payload;

      try {
        ({ payload } = await jwtVerify(token, key, {
          algorithms: ["HS256"],
          issuer: sessionIssuer,
          audience: sessionAudience,
        }));
      } catch (error) {
        if (error instanceof errors.JOSEError) {
          return null;
        }

        throw error;
      }

      if (
        typeof payload.sub !== "string" ||
        typeof payload.email !== "string" ||
        typeof payload.name !== "string" ||
        (payload.role !== "CLIENT" && payload.role !== "ADMIN")
      ) {
        return null;
      }

      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      };
    },
  };
}
