export interface EnvConfig {
  publicHost: string;
  adminPrefix: string;
}

export function getEnvConfig(): EnvConfig {
  if (process.env.NODE_ENV === "production") {
    return {
      publicHost: process.env.PUBLIC_HOST || "",
      adminPrefix: process.env.ADMIN_HOST_PREFIX || "",
    };
  }

  return {
    publicHost: process.env.PUBLIC_HOST_DEV || "",
    adminPrefix: process.env.ADMIN_HOST_PREFIX_DEV || "",
  };
}
