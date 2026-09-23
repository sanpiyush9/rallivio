import type { DiscoverySourceId } from "./source-adapters";

export type TrendObservation = {
  source: DiscoverySourceId;
  entityKey: string;
  observedAt: string;
  value: number;
  region?: string | null;
};

export type TrendEvidence = {
  sourceCount: number;
  regionCount: number;
  observationCount: number;
  velocity: number;
  acceleration: number;
  persistence: number;
  novelty: number;
};

export type TrendScore = {
  score: number;
  state: "emerging" | "accelerating" | "viral" | "persistent";
  evidence: TrendEvidence;
};

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

/**
 * Calculates percentage change between two observations. The small floor
 * prevents a zero/near-zero baseline from producing meaningless infinity.
 */
export function percentageChange(previous: number, current: number) {
  const baseline = Math.max(Math.abs(previous), 1);
  return ((current - previous) / baseline) * 100;
}

/**
 * Turns two adjacent changes into a bounded acceleration signal.
 * Positive acceleration means attention is increasing faster than before.
 */
export function accelerationFromSeries(values: number[]) {
  if (values.length < 3) return 0;

  const changes: number[] = [];
  for (let index = 1; index < values.length; index += 1) {
    changes.push(percentageChange(values[index - 1], values[index]));
  }

  const previous = changes[changes.length - 2] ?? 0;
  const current = changes[changes.length - 1] ?? 0;
  return clamp(current - previous);
}

/**
 * Computes source/region diversity and temporal momentum for one canonical
 * trend entity. It deliberately does not invent missing observations.
 */
export function scoreTrend(observations: TrendObservation[]): TrendScore {
  if (!observations.length) {
    return {
      score: 0,
      state: "emerging",
      evidence: {
        sourceCount: 0,
        regionCount: 0,
        observationCount: 0,
        velocity: 0,
        acceleration: 0,
        persistence: 0,
        novelty: 0,
      },
    };
  }

  const ordered = [...observations].sort(
    (a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt),
  );
  const values = ordered.map((observation) => Math.max(observation.value, 0));
  const latest = values.at(-1) ?? 0;
  const previous = values.at(-2) ?? latest;
  const velocity = clamp(percentageChange(previous, latest));
  const acceleration = accelerationFromSeries(values);

  const sourceCount = new Set(ordered.map((observation) => observation.source)).size;
  const regions = new Set(
    ordered
      .map((observation) => observation.region)
      .filter((region): region is string => Boolean(region)),
  );

  // Persistence is based only on observed time buckets. Missing data is not
  // interpreted as zero, which prevents sparse sources from being penalized.
  const persistence = clamp(Math.min(100, ordered.length * 12.5));

  // Novelty is intentionally conservative until a historical baseline exists.
  // A single observation is new, but not evidence of a breakout by itself.
  const novelty = ordered.length <= 2 ? 100 : clamp(100 - ordered.length * 4);

  const diversity = clamp(sourceCount * 20);
  const geographicSpread = clamp(regions.size * 12.5);
  const score = Math.round(
    clamp(
      velocity * 0.35 +
        acceleration * 0.25 +
        diversity * 0.15 +
        geographicSpread * 0.1 +
        persistence * 0.1 +
        novelty * 0.05,
    ),
  );

  let state: TrendScore["state"] = "emerging";
  if (score >= 80 && sourceCount >= 3) state = "viral";
  else if (acceleration >= 45 || score >= 60) state = "accelerating";
  else if (persistence >= 50) state = "persistent";

  return {
    score,
    state,
    evidence: {
      sourceCount,
      regionCount: regions.size,
      observationCount: ordered.length,
      velocity: Math.round(velocity),
      acceleration: Math.round(acceleration),
      persistence: Math.round(persistence),
      novelty: Math.round(novelty),
    },
  };
}

/**
 * Groups raw observations into canonical cross-source trend entities. The
 * caller is responsible for supplying a stable entity key from its entity /
 * topic extraction layer.
 */
export function groupTrendObservations(observations: TrendObservation[]) {
  const groups = new Map<string, TrendObservation[]>();
  for (const observation of observations) {
    const group = groups.get(observation.entityKey) ?? [];
    group.push(observation);
    groups.set(observation.entityKey, group);
  }
  return groups;
}
