export function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function subscriberBucket(subscribers: number) {
  if (subscribers <= 0) return 0;
  return Math.floor(Math.log10(Math.max(1, subscribers)));
}

export function shrunkResidual(actualViews: number, expectedViews: number, sampleSize: number, k = 5) {
  if (actualViews <= 0 || expectedViews <= 0 || sampleSize <= 0) return null;
  const residual = Math.log(actualViews / expectedViews);
  return { residual, shrunk: residual * (sampleSize / (sampleSize + k)) };
}

export function freshnessAllows(observedAt: string, windowMs: number, now = Date.now()) {
  const age = now - new Date(observedAt).getTime();
  return Number.isFinite(age) && age >= 0 && age <= windowMs;
}
