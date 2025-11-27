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

/**
 * Calculates a linear regression forecast based on the last N days of data.
 * Includes standard error for confidence intervals.
 */
export const calculatePrediction = (data: WeightRecord[], lookbackDays: number = 45, forecastDays: number = 30): PredictionResult | null => {
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
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // 4. Calculate Standard Error (for confidence intervals)
  // How far, on average, are the real points from the trend line?
  const residuals = recentData.map((d, i) => {
    const predicted = slope * xValues[i] + intercept;
    return Math.pow(d.weight - predicted, 2);
  });
  const sumSquaredResiduals = residuals.reduce((a, b) => a + b, 0);
  const stdError = Math.sqrt(sumSquaredResiduals / (n - 2));

  // 5. Generate Points (History + Forecast)
  const points: PredictionPoint[] = [];
  const msPerDay = 1000 * 60 * 60 * 24;

  // Add History Points (for visual context)
  recentData.forEach((d, i) => {
    const daysSinceCutoff = xValues[i];
    const trendValue = slope * daysSinceCutoff + intercept;
    points.push({
      date: d.date,
      dateStr: d.originalDateString,
      weight: d.weight,
      predicted: trendValue, // The trend line at this point
      lowerBound: trendValue - stdError,
      upperBound: trendValue + stdError,
      isFuture: false
    });
  });

  // Add Future Points
  const lastRealDayIndex = (lastDate.getTime() - cutoffDate.getTime()) / msPerDay;
  
  for (let i = 1; i <= forecastDays; i++) {
    const futureDayIndex = lastRealDayIndex + i;
    const futureDate = new Date(lastDate.getTime() + i * msPerDay);
    
    const predictedWeight = slope * futureDayIndex + intercept;
    
    // Confidence interval widens slightly as we go further into the future
    const uncertaintyMultiplier = 1 + (i / forecastDays) * 0.5;
    const margin = stdError * 1.96 * uncertaintyMultiplier; // 95% confidence approx

    points.push({
      date: futureDate,
      dateStr: futureDate.toLocaleDateString('ca-ES'),
      weight: null,
      predicted: predictedWeight,
      lowerBound: predictedWeight - margin,
      upperBound: predictedWeight + margin,
      isFuture: true
    });
  }

  // 6. Find Next Milestone
  // If losing weight (slope < 0), next milestone is floor(current)
  // If gaining weight (slope > 0), next milestone is ceil(current)
  let nextMilestone = null;
  const currentTrendWeight = points.find(p => p.isFuture)?.predicted || recentData[recentData.length - 1].weight;
  
  if (Math.abs(slope) > 0.001) { // If there is a noticeable trend
    const targetWeight = slope < 0 ? Math.floor(currentTrendWeight) : Math.ceil(currentTrendWeight);
    
    // Check if we already passed it or if it's the current integer
    const target = (targetWeight === Math.floor(currentTrendWeight) && slope < 0) ? targetWeight - 0.5 : targetWeight; // Aim for X.5 or just next int
    
    // Find date in future points
    const milestonePoint = points.find(p => p.isFuture && (slope < 0 ? p.predicted <= targetWeight : p.predicted >= targetWeight));
    
    if (milestonePoint) {
      nextMilestone = {
        weight: targetWeight,
        date: milestonePoint.date
      };
    }
  }

  // Calculate R-Squared (Fit quality)
  const meanY = sumY / n;
  const totalSumSquares = yValues.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
  const rSquared = 1 - (sumSquaredResiduals / totalSumSquares);

  return {
    points,
    dailyChange: slope,
    predictedWeight30Days: slope * (lastRealDayIndex + forecastDays) + intercept,
    rSquared,
    nextMilestone
  };
};