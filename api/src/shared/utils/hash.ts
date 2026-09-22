// Bun.password is native (argon2id by default) — no native module to
// compile, which matters since this runs on a Windows dev machine with no
// build toolchain confirmed.

export function hashPassword(plain: string): Promise<string> {
  return Bun.password.hash(plain);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return Bun.password.verify(plain, hash);
}
