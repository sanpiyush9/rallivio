export function hasValidSignalObservation(
  statsRefreshedAt: string | null,
  signalObservedAt: string | null,
) {
  if (!statsRefreshedAt || !signalObservedAt) return false;
  const refreshed = Date.parse(statsRefreshedAt);
  const observed = Date.parse(signalObservedAt);
  return Number.isFinite(refreshed) && Number.isFinite(observed) && observed >= refreshed;
}
