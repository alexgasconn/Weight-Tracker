import { WeightRecord, StatGroup } from '../types';

export const groupData = (data: WeightRecord[], period: 'year' | 'month' | 'week' | 'day'): StatGroup[] => {
  const groups: Record<string, StatGroup> = {};

  data.forEach(record => {
    const date = record.date;
    let key = '';
    let label = '';

    if (period === 'year') {
      key = date.getFullYear().toString();
      label = key;
    } else if (period === 'month') {
      const month = date.getMonth();
      const year = date.getFullYear();
      key = `${year}-${month}`;
      label = date.toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' });
      label = label.charAt(0).toUpperCase() + label.slice(1);
    } else if (period === 'week') {
      const [year, week] = getWeekNumber(date);
      key = `${year}-W${week.toString().padStart(2, '0')}`;
      label = `Setmana ${week}, ${year}`;
    } else if (period === 'day') {
      // Create a unique key for the day
      key = date.toISOString().split('T')[0];
      label = date.toLocaleDateString('ca-ES', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
      label = label.charAt(0).toUpperCase() + label.slice(1);
    }

    if (!groups[key]) {
      groups[key] = {
        key,
        label,
        count: 0,
        sum: 0,
        avg: 0,
        min: record.weight,
        max: record.weight,
        firstDate: date,
        lastDate: date
      };
    }

    const g = groups[key];
    g.count++;
    g.sum += record.weight;
    g.min = Math.min(g.min, record.weight);
    g.max = Math.max(g.max, record.weight);
    if (date < g.firstDate) g.firstDate = date;
    if (date > g.lastDate) g.lastDate = date;
  });

  // Calculate averages and convert to array
  return Object.values(groups)
    .map(g => ({
      ...g,
      avg: g.sum / g.count
    }))
    .sort((a, b) => b.firstDate.getTime() - a.firstDate.getTime()); // Newest first
};

// Helper to get ISO week number
function getWeekNumber(d: Date): [number, number] {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return [d.getUTCFullYear(), weekNo];
}

// --- NEW ANALYTICS FUNCTIONS ---

/**
 * Calculates a Moving Average (Rolling Mean) for the dataset.
 */
export const calculateMovingAverage = (data: WeightRecord[], windowSize: number) => {
  return data.map((record, index, array) => {
    const start = Math.max(0, index - windowSize + 1);
    const subset = array.slice(start, index + 1);
    const sum = subset.reduce((acc, curr) => acc + curr.weight, 0);
    const avg = sum / subset.length;

    return {
      ...record,
      movingAverage: avg
    };
  });
};

export interface WeekdayStat {
  dayName: string;
  dayIndex: number; // 0 = Sunday, 1 = Monday...
  avgWeight: number;
  minWeight: number;
  maxWeight: number;
  avgDelta: number; 
  count: number;
  range: [number, number]; 
}

/**
 * Groups data by day of the week.
 * Improved logic to handle Sundays (index 0) correctly.
 */
export const calculateWeekdayStats = (data: WeightRecord[]): WeekdayStat[] => {
  // Array indices 0-6 correspond to Sunday-Saturday
  const days = [
    { name: 'Diumenge', sum: 0, count: 0, min: Infinity, max: -Infinity, deltaSum: 0, deltaCount: 0 }, // 0
    { name: 'Dilluns', sum: 0, count: 0, min: Infinity, max: -Infinity, deltaSum: 0, deltaCount: 0 },  // 1
    { name: 'Dimarts', sum: 0, count: 0, min: Infinity, max: -Infinity, deltaSum: 0, deltaCount: 0 },  // 2
    { name: 'Dimecres', sum: 0, count: 0, min: Infinity, max: -Infinity, deltaSum: 0, deltaCount: 0 }, // 3
    { name: 'Dijous', sum: 0, count: 0, min: Infinity, max: -Infinity, deltaSum: 0, deltaCount: 0 },   // 4
    { name: 'Divendres', sum: 0, count: 0, min: Infinity, max: -Infinity, deltaSum: 0, deltaCount: 0 },// 5
    { name: 'Dissabte', sum: 0, count: 0, min: Infinity, max: -Infinity, deltaSum: 0, deltaCount: 0 }  // 6
  ];

  // Sort data by date first for Delta calc
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());

  sortedData.forEach((record, idx) => {
    const dayIndex = record.date.getDay(); // 0-6
    const stats = days[dayIndex];

    stats.sum += record.weight;
    stats.count += 1;
    stats.min = Math.min(stats.min, record.weight);
    stats.max = Math.max(stats.max, record.weight);

    // Delta stats (Change from previous entry)
    if (idx > 0) {
      const prevRecord = sortedData[idx - 1];
      // Only calculate delta if within reasonable time (e.g. < 48 hours gap) or just sequential
      const delta = record.weight - prevRecord.weight;
      stats.deltaSum += delta;
      stats.deltaCount += 1;
    }
  });

  // Transform to final structure
  const result = days.map((d, index) => ({
    dayIndex: index,
    dayName: d.name,
    avgWeight: d.count > 0 ? d.sum / d.count : 0,
    minWeight: d.count > 0 ? d.min : 0,
    maxWeight: d.count > 0 ? d.max : 0,
    avgDelta: d.deltaCount > 0 ? d.deltaSum / d.deltaCount : 0,
    count: d.count,
    range: [d.count > 0 ? d.min : 0, d.count > 0 ? d.max : 0] as [number, number]
  }));

  // Sort: Shift Sunday (0) to the end of the array for European display (Mon-Sun)
  // Input: [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  // Desired: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  const sunday = result[0];
  const monToSat = result.slice(1);
  return [...monToSat, sunday];
};