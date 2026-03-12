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

