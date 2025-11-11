export interface DailyLog {
  date: Date;
  dateString: string;
  weight: number | null;
  tendency: number | null;
}

export interface WeightRangeData {
  periodLabel: string;
  range: [number, number]; // [min, max]
}
