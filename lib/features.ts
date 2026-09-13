function featureEnabled(value: string | undefined) {
  return value !== 'false' && value !== '0';
}

export const ENABLE_GROUPS = featureEnabled(process.env.EXPO_PUBLIC_ENABLE_GROUPS);
export const ENABLE_ADMIN = featureEnabled(process.env.EXPO_PUBLIC_ENABLE_ADMIN);
