export interface DailyLog {
  date: Date;
  dateString: string;
  weight: number | null;
  tendency: number | null;
  // FIX: Added optional properties to support macronutrient and calorie breakdown charts.
  // This resolves TypeScript errors where these properties were accessed but not defined.
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
