function required(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

function requiredBase64(name: string, expectedBytes: number): Buffer {
  const val = required(name);
  const buf = Buffer.from(val, "base64");
  if (buf.length !== expectedBytes) {
    throw new Error(
      `${name} must be ${expectedBytes} bytes (base64). Got ${buf.length}.`,
    );
  }
  return buf;
}

export function getEnv() {
  return {
    APP_URL: required("APP_URL").replace(/\/$/, ""),
    MASTER_ENC_KEY: requiredBase64("MASTER_ENC_KEY", 32),
    JWT_SECRET: requiredBase64("JWT_SECRET", 32),
    SESSION_SECRET: required("SESSION_SECRET"),
    ALLOW_SIGNUP: process.env.ALLOW_SIGNUP !== "false",
  };
}
