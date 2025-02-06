import * as dotenv from "dotenv";

dotenv.config();

interface Config {
  PORT: number;
  JWKS_URL: string;
}

const port = process;

const config: Config = {
  PORT: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  JWKS_URL:
    process.env.JWKS_URL ||
    (() => {
      throw new Error("JWKS_URL is not defined");
    })(),
};

export default config;
