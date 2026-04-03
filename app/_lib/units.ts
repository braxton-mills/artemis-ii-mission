export const KM_TO_MI = 0.621371;
export const KMS_TO_MPH = 2236.94;

export function kmToMi(km: number): number {
  return km * KM_TO_MI;
}

export function kmsToMph(kms: number): number {
  return kms * KMS_TO_MPH;
}

export function formatImperial(n: number): string {
  if (n >= 1000) return Math.round(n).toLocaleString();
  return Math.round(n).toString();
}
