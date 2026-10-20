/**
 * Scan calibration: per-dimension linear correction from app measurement to tape measurement.
 * Identity until `npm run calibrate -- calibration.csv` rewrites this file from real hands
 * (gate G1: at least 10 hands, median error ≤ 3 mm on hand length and knuckle width).
 */
import { IDENTITY_CALIBRATION, type Calibration } from './measure.js';

export const calibration: Calibration = IDENTITY_CALIBRATION;
