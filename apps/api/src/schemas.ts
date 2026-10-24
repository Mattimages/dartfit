import { z } from 'zod';

export const MeasurementsSchema = z.object({
  handLengthMm: z.number().min(120).max(260),
  palmWidthMm: z.number().min(40).max(140),
  indexLengthMm: z.number().min(40).max(140),
  middleLengthMm: z.number().min(40).max(150),
  thumbIndexSpanMm: z.number().min(40).max(260),
  spreadMm: z.number().min(0).max(30),
  samples: z.number().int().min(3).max(500),
  calibrated: z.boolean(),
  unscaled: z.boolean().optional(),
  /** Ruler entry: one length, typical proportions (the hand type may reshape them). */
  proportions: z.enum(['reference']).optional(),
});

export const AnswersSchema = z.object({
  tip: z.enum(['steel', 'soft']),
  hold: z.enum(['front', 'middle', 'rear']),
  fingers: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  throwStyle: z.enum(['flat', 'arc', 'unsure']),
  moisture: z.enum(['dry', 'normal', 'sweaty']),
  gripFeel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  thickness: z.enum(['slim', 'standard', 'chunky', 'auto']),
  /** Without a scan: the hand in words. */
  handType: z.enum(['slender', 'average', 'stubby']).optional(),
  current: z
    .object({
      /** Picked from the catalogue: the server fills the specs from its own data. */
      variantId: z.string().max(80).optional(),
      weightG: z.number().min(10).max(40),
      lengthMm: z.number().min(30).max(70).optional(),
      diameterMm: z.number().min(5).max(10).optional(),
      gripIntensity: z.number().min(1).max(5).optional(),
      balance: z.enum(['front', 'centre', 'rear']).optional(),
      feel: z.enum(['too_light', 'right', 'too_heavy']),
      gripFeel: z.enum(['too_smooth', 'right', 'too_sharp']).optional(),
      thicknessFeel: z.enum(['too_thin', 'right', 'too_thick']).optional(),
      lengthFeel: z.enum(['too_short', 'right', 'too_long']).optional(),
    })
    .optional(),
  budgetUsd: z.number().min(10).max(1000).optional(),
  heightCm: z.number().min(130).max(220).optional(),
  forearmCm: z.number().min(18).max(36).optional(),
});

export const FitRequest = z.object({
  measurements: MeasurementsSchema.optional(),
  answers: AnswersSchema,
  lang: z.enum(['nl', 'en']).default('nl'),
  country: z.string().length(2).toUpperCase().optional(),
});

export const ExplainRequest = z.object({
  fitId: z.string().uuid(),
  variantId: z.string().max(80).optional(),
  lang: z.enum(['nl', 'en']).optional(),
});

export const LoginRequest = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  lang: z.enum(['nl', 'en']).default('nl'),
  fitId: z.string().uuid().optional(),
  /** 'alerts': the "keep me posted" box under a result. Same double opt-in, different email wording. */
  purpose: z.enum(['login', 'alerts']).default('login'),
  alertsEmail: z.boolean().default(false),
  feedbackEmail: z.boolean().default(false),
  /** Wording version of the consent text the person saw, stored with the consent. */
  consentVersion: z.string().max(20).default('2026-10-v1'),
  /** Age gate for accounts (Dutch age of digital consent is 16). */
  confirmsAge16: z.literal(true),
});

export const OptinsRequest = z.object({
  alertsEmail: z.boolean().optional(),
  alertsPush: z.boolean().optional(),
  feedbackEmail: z.boolean().optional(),
  consentVersion: z.string().max(20).default('2026-10-v1'),
});

export const PushSubscribeRequest = z.object({
  endpoint: z.string().url().startsWith('https://'),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
});

export const FeedbackRequest = z.object({
  u: z.string(),
  x: z.string().optional(),
  s: z.string(),
  bought: z.boolean(),
  variantId: z.string().max(80).optional(),
  weightG: z.number().min(10).max(40).optional(),
  feel: z.enum(['too_light', 'right', 'too_heavy']).optional(),
});

export const AdminVariantRequest = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(80),
  modelId: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(80),
  brand: z.string().min(2).max(60),
  model: z.string().min(2).max(120),
  tip: z.enum(['steel', 'soft']),
  weightG: z.number().min(12).max(40),
  lengthMm: z.number().min(30).max(70),
  diameterMm: z.number().min(5).max(10),
  shape: z.enum(['straight', 'torpedo', 'tapered', 'bomb', 'scalloped']).nullable(),
  balance: z.enum(['front', 'centre', 'rear']).nullable(),
  gripIntensity: z.number().min(1).max(5).nullable(),
  tungstenPct: z.number().min(0).max(100),
  priceUsd: z.number().positive().nullable(),
  sourceUrl: z.string().url().startsWith('https://'),
});
