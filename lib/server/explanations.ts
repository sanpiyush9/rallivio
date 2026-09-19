export type SignalEvidence = {
  signal?: string | null;
  momentum?: number | null;
  velocity?: number | null;
  acceleration?: number | null;
  engagement?: number | null;
  anomalyScore?: number | null;
  observedViews?: number | null;
  historyAvailable?: boolean | null;
};

export function explainSignal(input: {
  title?: string | null;
  creator?: string | null;
  topic?: string | null;
  evidence: SignalEvidence;
}) {
  const e = input.evidence;
  const facts: string[] = [];

  if (typeof e.velocity === "number") facts.push(`view velocity percentile/evidence: ${Math.round(e.velocity)}`);
  if (typeof e.acceleration === "number" && e.historyAvailable) {
    facts.push(`acceleration evidence: ${Math.round(e.acceleration)}`);
  }
  if (typeof e.engagement === "number") facts.push(`engagement evidence: ${Math.round(e.engagement)}`);
  if (typeof e.anomalyScore === "number") facts.push(`anomaly score: ${Number(e.anomalyScore).toFixed(2)}`);

  const subject = input.title ?? input.creator ?? input.topic ?? "This discovery item";
  const signal = e.signal ?? "Observed";

  return {
    version: "rallivio-explanation-v1",
    subject,
    signal,
    summary: facts.length
      ? `${signal} is supported by ${facts.join("; ")}.`
      : `${signal} has insufficient evidence for a metric-specific explanation.`,
    evidence: facts,
    limitations: [
      "Explanation is generated from persisted RALLIVIO evidence.",
      "It does not invent missing metrics or imply causation.",
      ...(e.historyAvailable === false ? ["Historical observations are insufficient for acceleration claims."] : []),
    ],
  };
}
