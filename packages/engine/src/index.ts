export * from './types.js';
export { config, provenance, provenanceOf, numericLeaves, ENGINE_VERSION } from './config.js';
export { fit, combine, handTier, enforcePhysics, gripZone, setupFor } from './fit.js';
export * from './barrel.js';
export {
  recommend,
  scoreVariant,
  proTwin,
  sensitivity,
  qualityOf,
  topShape,
  priceTiers,
  matchBreakdown,
  matchPctOf,
  type PriceTier,
  type MatchBreakdown,
  type MatchPart,
} from './match.js';
export type { RecommendOptions, ProTwin, WhatIf } from './match.js';
export * from './measure.js';
export { calibration } from './calibration.js';
export * from './vision.js';
export { allowedNumbers, findUnsupportedNumbers, templateExplanation, buildExplainInput } from './explain.js';
export type { ExplainInput, Lang } from './explain.js';
export { USD_PER_EUR, PRICE_CLASS_EUR, tierBoundsUsd } from './money.js';
export {
  handFromHeight,
  measurementsFromHeight,
  launchAngle,
  trajectory,
  effectiveThrowStyle,
} from './body.js';
