import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { HttpError } from "../domain/errors";
import type { SafeUser } from "../domain/user";
import type { UserRepository } from "../domain/user";

type AuthConfiguration = {
  jwtSecret: string;
  jwtExpiresIn: string;
};

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly config: AuthConfiguration,
  ) {}

  async register(name: string, email: string, password: string) {
    if (await this.users.findByEmail(email)) {
      throw new HttpError("Ya existe una cuenta con ese correo.", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.users.create({ name, email, passwordHash });
    return { user, token: this.createToken(user) };
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpError("Correo o contraseña incorrectos.", 401);
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;
    return { user: safeUser, token: this.createToken(safeUser) };
  }

  private createToken(user: SafeUser) {
    const options: SignOptions = { expiresIn: this.config.jwtExpiresIn as SignOptions["expiresIn"] };
    return jwt.sign({ id: user.id, role: user.role }, this.config.jwtSecret, options);
  }
}
