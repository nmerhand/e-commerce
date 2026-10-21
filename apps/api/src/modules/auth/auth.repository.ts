import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { EmailAlreadyRegisteredError } from "./auth.errors";
import type { AuthRecord, AuthRepository, AuthUser } from "./auth.types";

const authUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
} as const;

export class PrismaAuthRepository implements AuthRepository {
  async findByEmail(email: string): Promise<AuthRecord | null> {
    return prisma.user.findUnique({
      where: { email },
      select: { ...authUserSelect, passwordHash: true },
    });
  }

  async createUserWithCart(input: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<AuthUser> {
    try {
      return await prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash: input.passwordHash,
          cart: { create: {} },
        },
        select: authUserSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new EmailAlreadyRegisteredError();
      }

      throw error;
    }
  }
}
