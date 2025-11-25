export interface WeightRecord {
  date: Date;
  weight: number;
  bmi: number; // Added BMI
  originalDateString: string;
}

export interface WeightStats {
  current: number;
  start: number;
  changeTotal: number;
  changeWeekly: number; // Avg change over last 7 entries
  min: number;
  max: number;
  bmi?: number; 
  average: number;
}

export enum TimeRange {
  ALL = 'ALL',
  MONTH1 = '1M',
  MONTH3 = '3M',
  YEAR1 = '1Y'
}

export interface AiInsight {
  summary: string;
  advice: string;
  trend: 'positive' | 'negative' | 'stable';
}

export interface StatGroup {
  key: string;
  label: string;
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  firstDate: Date;
  lastDate: Date;
}
