import { WeightRecord } from '../types';

export interface PredictionPoint {
  date: Date;
  dateStr: string;
  weight: number | null; // Null for future points (in context of history)
  predicted: number;
  lowerBound: number;
  upperBound: number;
  isFuture: boolean;
}

export interface PredictionResult {
  points: PredictionPoint[];
  dailyChange: number; // Slope
  predictedWeight30Days: number;
  rSquared: number; // Confidence/Consistency score (0 to 1)
  nextMilestone: { weight: number; date: Date } | null;
}

export interface ModelPrediction {
  name: string;
  color?: string;
  points: PredictionPoint[];
}

export interface PredictionResultV2 extends PredictionResult {
  models: ModelPrediction[];
  ensemblePoints: PredictionPoint[];
}

/**
 * Calculates a linear regression forecast based on the last N days of data.
 * Includes standard error for confidence intervals.
 */
export interface PredictionOptions {
  alpha?: number; // for exponential smoothing
  maWindow?: number; // moving average window
  forestSize?: number; // ensemble size
}

export const calculatePrediction = (data: WeightRecord[], lookbackDays: number = 90, forecastDays: number = 30, options: PredictionOptions = {}): PredictionResultV2 | null => {
  if (data.length < 5) return null;

  // 1. Filter data to lookback period
  const lastDate = data[data.length - 1].date;
  const cutoffDate = new Date(lastDate);
  cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

  const recentData = data.filter(d => d.date >= cutoffDate);
  if (recentData.length < 3) return null;

  // 2. Prepare X (Time) and Y (Weight)
  // X is normalized to days since cutoff to keep numbers smaller
  const xValues = recentData.map(d => (d.date.getTime() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24));
  const yValues = recentData.map(d => d.weight);

  const n = xValues.length;
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

  // 3. Calculate Slope (m) and Intercept (b) -> y = mx + b
  // Helper: linear fit
  const fitLinear = (xs: number[], ys: number[]) => {
    const m = xs.length;
    const sx = xs.reduce((a, b) => a + b, 0);
    const sy = ys.reduce((a, b) => a + b, 0);
    const sxy = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
    const sxx = xs.reduce((sum, x) => sum + x * x, 0);
    const slopeL = (m * sxy - sx * sy) / (m * sxx - sx * sx || 1);
    const interceptL = (sy - slopeL * sx) / m;
    return { slope: slopeL, intercept: interceptL };
  };

  // Helper: predict series for indices (both historical and future)
  const msPerDay = 1000 * 60 * 60 * 24;
  const lastRealDayIndex = (lastDate.getTime() - cutoffDate.getTime()) / msPerDay;
  const indices: number[] = [];
  // historical indices for recentData
  for (let i = 0; i < xValues.length; i++) indices.push(xValues[i]);
  // future indices
  for (let i = 1; i <= forecastDays; i++) indices.push(lastRealDayIndex + i);

  // Implement models
  const models: ModelPrediction[] = [];

  // 1) Linear Regression model
  const lr = fitLinear(xValues, yValues);
  const lrPred = indices.map(idx => lr.slope * idx + lr.intercept);
  const lrPoints: PredictionPoint[] = [];
  indices.forEach((idx, i) => {
    const isFuture = idx > lastRealDayIndex;
    const date = isFuture ? new Date(lastDate.getTime() + (i - xValues.length + 1) * msPerDay) : recentData[i].date;
    const weight = isFuture ? null : recentData[i]?.weight ?? null;
    lrPoints.push({ date, dateStr: date.toLocaleDateString('ca-ES'), weight, predicted: lrPred[i], lowerBound: lrPred[i], upperBound: lrPred[i], isFuture });
  });
  models.push({ name: 'Linear Regression', color: '#7e22ce', points: lrPoints });

  // 2) Exponential Smoothing (SES)
  const alpha = typeof options.alpha === 'number' ? options.alpha : 0.2;
  const sesSeries: number[] = [];
  let s = yValues[0];
  for (let i = 0; i < yValues.length; i++) {
    s = alpha * yValues[i] + (1 - alpha) * s;
    sesSeries.push(s);
  }
  const sesLast = sesSeries[sesSeries.length - 1];
  const sesPred = indices.map((idx, i) => (i < xValues.length ? sesSeries[i] : sesLast));
  const sesPoints: PredictionPoint[] = [];
  indices.forEach((idx, i) => {
    const isFuture = idx > lastRealDayIndex;
    const date = isFuture ? new Date(lastDate.getTime() + (i - xValues.length + 1) * msPerDay) : recentData[i].date;
    const weight = isFuture ? null : recentData[i]?.weight ?? null;
    sesPoints.push({ date, dateStr: date.toLocaleDateString('ca-ES'), weight, predicted: sesPred[i], lowerBound: sesPred[i], upperBound: sesPred[i], isFuture });
  });
  models.push({ name: 'Exp Smoothing', color: '#06b6d4', points: sesPoints });

  // 3) Moving Average
  const window = typeof options.maWindow === 'number' ? Math.max(1, Math.floor(options.maWindow)) : 7;
  const maSeries: number[] = [];
  for (let i = 0; i < yValues.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = yValues.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    maSeries.push(avg);
  }
  const maLast = maSeries[maSeries.length - 1];
  const maPred = indices.map((idx, i) => (i < xValues.length ? maSeries[i] : maLast));
  const maPoints: PredictionPoint[] = [];
  indices.forEach((idx, i) => {
    const isFuture = idx > lastRealDayIndex;
    const date = isFuture ? new Date(lastDate.getTime() + (i - xValues.length + 1) * msPerDay) : recentData[i].date;
    const weight = isFuture ? null : recentData[i]?.weight ?? null;
    maPoints.push({ date, dateStr: date.toLocaleDateString('ca-ES'), weight, predicted: maPred[i], lowerBound: maPred[i], upperBound: maPred[i], isFuture });
  });
  models.push({ name: 'Moving Avg (7d)', color: '#10b981', points: maPoints });

  // 4) TimeForest - bootstrap ensemble of linear regressions
  const ensembles: number[][] = [];
  const forestSize = typeof options.forestSize === 'number' ? Math.max(1, Math.floor(options.forestSize)) : 30;
  for (let t = 0; t < forestSize; t++) {
    const sampleX: number[] = [];
    const sampleY: number[] = [];
    for (let sIdx = 0; sIdx < xValues.length; sIdx++) {
      const pick = Math.floor(Math.random() * xValues.length);
      sampleX.push(xValues[pick]);
      sampleY.push(yValues[pick]);
    }
    const f = fitLinear(sampleX, sampleY);
    const preds = indices.map(idx => f.slope * idx + f.intercept);
    ensembles.push(preds);
  }
  // Average ensemble
  const tfPred: number[] = indices.map((_, i) => {
    const vals = ensembles.map(e => e[i]);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  });
  const tfPoints: PredictionPoint[] = [];
  indices.forEach((idx, i) => {
    const isFuture = idx > lastRealDayIndex;
    const date = isFuture ? new Date(lastDate.getTime() + (i - xValues.length + 1) * msPerDay) : recentData[i].date;
    const weight = isFuture ? null : recentData[i]?.weight ?? null;
    // use std deviation across ensemble for bounds
    const vals = ensembles.map(e => e[i]);
    const mean = tfPred[i];
    const variance = vals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / Math.max(1, vals.length - 1);
    const std = Math.sqrt(variance);
    tfPoints.push({ date, dateStr: date.toLocaleDateString('ca-ES'), weight, predicted: mean, lowerBound: mean - std * 1.96, upperBound: mean + std * 1.96, isFuture });
  });
  models.push({ name: 'TimeForest', color: '#f59e0b', points: tfPoints });

  // Build ensemble by averaging model predictions per index
  const ensemblePoints: PredictionPoint[] = [];
  indices.forEach((_, i) => {
    const date = models[0].points[i].date;
    const isFuture = models[0].points[i].isFuture;
    const weight = models[0].points[i].weight;
    const preds = models.map(m => m.points[i].predicted);
    const mean = preds.reduce((a, b) => a + b, 0) / preds.length;
    const variance = preds.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / Math.max(1, preds.length - 1);
    const std = Math.sqrt(variance);
    ensemblePoints.push({ date, dateStr: date.toLocaleDateString('ca-ES'), weight, predicted: mean, lowerBound: mean - std * 1.96, upperBound: mean + std * 1.96, isFuture });
  });

  // dailyChange: compute simple linear slope on actual recentData (same as lr)
  const dailyChange = lr.slope;

  // predictedWeight at horizon from ensemble
  const predictedWeightAtHorizon = ensemblePoints[ensemblePoints.length - 1].predicted;

  // Next milestone using ensemble future points
  let nextMilestone = null;
  if (Math.abs(dailyChange) > 0.001) {
    const currentTrendWeight = ensemblePoints.find(p => p.isFuture)?.predicted ?? recentData[recentData.length - 1].weight;
    const targetWeight = dailyChange < 0 ? Math.floor(currentTrendWeight) : Math.ceil(currentTrendWeight);
    const milestonePoint = ensemblePoints.find(p => p.isFuture && (dailyChange < 0 ? p.predicted <= targetWeight : p.predicted >= targetWeight));
    if (milestonePoint) nextMilestone = { weight: targetWeight, date: milestonePoint.date };
  }

  // R-squared (from linear model on recentData)
  const meanY = sumY / n;
  const residuals = xValues.map((x, i) => Math.pow(yValues[i] - (lr.slope * x + lr.intercept), 2));
  const sumSquaredResiduals = residuals.reduce((a, b) => a + b, 0);
  const totalSumSquares = yValues.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
  const rSquared = 1 - (sumSquaredResiduals / totalSumSquares);

  // Build points for compatibility (use ensemblePoints)
  const points: PredictionPoint[] = ensemblePoints;

  return {
    points,
    dailyChange,
    predictedWeight30Days: predictedWeightAtHorizon,
    rSquared,
    nextMilestone,
    models,
    ensemblePoints
  };
};