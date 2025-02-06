import { jwtVerify, createRemoteJWKSet, JWTPayload } from "jose";

const JWKS_URL = "http://localhost:8000/.well-known/jwks.json";

export async function validateJWT(token: string): Promise<JWTPayload | null> {
  const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

  try {
    const { payload } = await jwtVerify(token, JWKS, {});

    return payload;
  } catch (err) {
    return null;
  }
}
