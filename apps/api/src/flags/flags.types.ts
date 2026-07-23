/**
 * Known env-backed feature flags (Track 18).
 * Wildcard legacy-write flags are resolved via {@link FlagsService.isLegacyWriteAllowed}.
 */
export type FeatureFlags = {
  /** Public POST /auth/register. Default false. */
  registrationEnabled: boolean;
};
