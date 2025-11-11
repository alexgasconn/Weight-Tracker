export interface DailyLog {
  date: Date;
  dateString: string;
  weight: number | null;
  tendency: number | null;
  // Fix: Add optional properties for macronutrients and calories to resolve type errors in chart components.
  protein?: number | null;
  carbs?: number | null;
  fats?: number | null;
  breakfast?: number | null;
  lunch?: number | null;
  snack?: number | null;
  dinner?: number | null;
}

export interface WeightRangeData {
  periodLabel: string;
  range: [number, number]; // [min, max]
}
