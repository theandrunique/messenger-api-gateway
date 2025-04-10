import { jwtVerify, createRemoteJWKSet, JWTPayload } from "jose";
import config from "../config";

export async function validateJWT(token: string): Promise<JWTPayload | null> {
  const JWKS = createRemoteJWKSet(new URL(config.JWKS_URL));

  try {
    const { payload } = await jwtVerify(token, JWKS, {});

    return payload;
  } catch (err) {
    return null;
  }
}
