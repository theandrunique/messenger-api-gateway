import { jwtVerify, createRemoteJWKSet, JWTPayload } from "jose";
import config from "./config";

const JWKS_URL = "http://localhost:8000/.well-known/jwks.json";

export async function validateJWT(token: string): Promise<JWTPayload | null> {
  const JWKS = createRemoteJWKSet(new URL(config.JWKS_URL));

  try {
    const { payload } = await jwtVerify(token, JWKS, {});

    return payload;
  } catch (err) {
    return null;
  }
}
