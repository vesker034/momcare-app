import dotenv from 'dotenv';

dotenv.config();

export const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;

  if (value === undefined || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const getEnvNumber = (key: string, fallback: number): number => {
  const value = process.env[key];

  if (value === undefined || value.trim().length === 0) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }

  return parsed;
};
