import { describe, expect, it } from "vitest";
import { EmailAlreadyRegisteredError } from "../src/modules/auth/auth.errors";
import { createAuthService } from "../src/modules/auth/auth.service";
import type {
  AuthRecord,
  AuthRepository,
  AuthUser,
} from "../src/modules/auth/auth.types";

const sessionSecret = "test-session-secret-with-more-than-32-bytes";

function createMemoryRepository(): AuthRepository {
  const users: AuthRecord[] = [];

  return {
    async findByEmail(email) {
      return users.find((user) => user.email === email) ?? null;
    },
    async createUserWithCart(input) {
      const user: AuthUser = {
        id: `user-${users.length + 1}`,
        email: input.email,
        name: input.name,
        role: "CLIENT",
      };
      users.push({ ...user, passwordHash: input.passwordHash });
      return user;
    },
  };
}

describe("authentication service", () => {
  it("hashes registration passwords and issues a verifiable session", async () => {
    const repository = createMemoryRepository();
    const service = createAuthService(repository, sessionSecret);
    const registration = await service.register({
      email: " Buyer@Example.com ",
      name: " Buyer ",
      password: "a-very-secure-password",
    });

    expect(registration.user.email).toBe("buyer@example.com");
    const storedUser = await repository.findByEmail("buyer@example.com");
    expect(storedUser?.passwordHash).not.toBe("a-very-secure-password");
    expect(storedUser?.passwordHash).toMatch(/^\$argon2id\$/);
    expect(await service.verifySession(registration.token)).toEqual(
      registration.user,
    );

    const login = await service.authenticate(
      "BUYER@example.com",
      "a-very-secure-password",
    );
    expect(login?.user).toEqual(registration.user);
  });

  it("rejects duplicate email addresses and incorrect passwords", async () => {
    const service = createAuthService(createMemoryRepository(), sessionSecret);
    const credentials = {
      email: "buyer@example.com",
      name: "Buyer",
      password: "a-very-secure-password",
    };

    await service.register(credentials);
    await expect(service.register(credentials)).rejects.toBeInstanceOf(
      EmailAlreadyRegisteredError,
    );
    await expect(
      service.authenticate(credentials.email, "incorrect-password"),
    ).resolves.toBeNull();
  });

  it("requires a sufficiently long session secret", () => {
    expect(() => createAuthService(createMemoryRepository(), "short")).toThrow(
      "SESSION_SECRET must contain at least 32 bytes",
    );
  });
});
