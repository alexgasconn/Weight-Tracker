import { WeightRecord } from '../types';

// The provided published HTML link
const SHEET_ID = '2PACX-1vQHBxexfNwpTBj3uAfTsa-3Y3ZUK7d88pfQBroQdkVtHHABVCvoWVsQdim3MtbQjOCgGukDvqiO3hOB';
// We try to convert the pubhtml link to a CSV export link for easier parsing
const CSV_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=0&single=true&output=csv`;

const USER_HEIGHT_M = 1.74; // Fixed height as requested

export const fetchWeightData = async (): Promise<WeightRecord[]> => {
  try {
    const response = await fetch(CSV_URL);
    
    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }

    const text = await response.text();
    return parseCSV(text);
  } catch (error) {
    console.error("Failed to fetch/parse data", error);
    throw error;
  }
};

const parseCSV = (csvText: string): WeightRecord[] => {
  const lines = csvText.split('\n');
  const records: WeightRecord[] = [];

  if (lines.length < 2) return [];

  // Parse Header to find columns
  // Regex handles commas inside quotes e.g. "72,5"
  const parseLine = (text: string) => text.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.trim().replace(/^"|"$/g, ''));

  const headerLine = lines[0].trim();
  const headers = parseLine(headerLine).map(h => h.toLowerCase());

  // Find indices for "Dia" and "Pes"
  let dateIndex = headers.findIndex(h => h.includes('dia') || h.includes('date'));
  let weightIndex = headers.findIndex(h => h.includes('pes') || h.includes('weight'));

  // Fallback to 0 and 1 if headers are missing or not found
  if (dateIndex === -1) dateIndex = 0;
  if (weightIndex === -1) weightIndex = 1;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = parseLine(line);

    if (parts.length > Math.max(dateIndex, weightIndex)) {
      const dateStr = parts[dateIndex];
      let weightStr = parts[weightIndex];
      
      // Clean quotes and handle European decimal comma (72,50 -> 72.50)
      if (weightStr) {
        weightStr = weightStr.replace(/"/g, '').replace(',', '.');
      }

      if (dateStr && weightStr) {
        const date = parseDate(dateStr);
        const weight = parseFloat(weightStr);

        if (!isNaN(weight) && date) {
          // Calculate BMI: weight (kg) / height (m)^2
          const bmi = weight / (USER_HEIGHT_M * USER_HEIGHT_M);

          records.push({
            date: date,
            weight: weight,
            bmi: parseFloat(bmi.toFixed(2)),
            originalDateString: dateStr
          });
        }
      }
    }
  }

  // Sort by date ascending
  return records.sort((a, b) => a.date.getTime() - b.date.getTime());
};

const parseDate = (dateStr: string): Date | null => {
  // Clean string
  dateStr = dateStr.trim();

  // Try parsing "DD/MM/YYYY" or "DD/MM/YY"
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
    let year = parseInt(parts[2], 10);
    
    // Handle 2 digit years (e.g., 24 -> 2024)
    if (year < 100) {
      year += 2000;
    }
    
    // Validate sensible year
    if (year > 1900 && year < 2100 && !isNaN(day) && !isNaN(month)) {
      return new Date(year, month, day);
    }
  }

  // Fallback to standard date parse
  const standardDate = new Date(dateStr);
  if (!isNaN(standardDate.getTime())) {
    return standardDate;
  }

  return null;
};

// Fallback demo data
export const getDemoData = (): WeightRecord[] => {
  const data: WeightRecord[] = [];
  const today = new Date();
  let weight = 85.0;
  
  for (let i = 365; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    // Random fluctuation with trend
    weight += (Math.random() - 0.55) * 0.2; 
    const w = parseFloat(weight.toFixed(2));
    data.push({
      date: d,
      weight: w,
      bmi: parseFloat((w / (USER_HEIGHT_M * USER_HEIGHT_M)).toFixed(2)),
      originalDateString: d.toLocaleDateString('ca-ES')
    });
  }
  return data;
};
