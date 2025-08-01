import { Paddler, PreferredSide } from '@/types';

export interface CSVPaddlerRow {
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  weight: string;
  preferredSide: PreferredSide;
  strengthScore: string;
  experienceScore: string;
}

export class CSVPaddlerManager {
  // Flexible parsing mappings
  private static readonly GENDER_MAPPINGS: Record<string, 'Male' | 'Female' | 'Other'> = {
    // Male variations
    'male': 'Male', 'm': 'Male', 'man': 'Male', 'boy': 'Male',
    // Female variations  
    'female': 'Female', 'f': 'Female', 'woman': 'Female', 'girl': 'Female',
    // Other variations
    'other': 'Other', 'x': 'Other', 'non-binary': 'Other', 'nb': 'Other', 
    'nonbinary': 'Other', 'unknown': 'Other', 'prefer not to say': 'Other'
  };

  private static readonly SIDE_MAPPINGS: Record<string, PreferredSide> = {
    // Left variations
    'left': 'Left', 'l': 'Left',
    // Right variations
    'right': 'Right', 'r': 'Right',
    // Ambi variations
    'ambi': 'Ambi', 'a': 'Ambi', 'ambidextrous': 'Ambi', 'either': 'Ambi', 
    'e': 'Ambi', 'both': 'Ambi', 'any': 'Ambi', 'no preference': 'Ambi'
  };

  // Helper methods for flexible parsing
  private static parseGender(input: string): 'Male' | 'Female' | 'Other' | null {
    if (!input?.trim()) return null;
    const normalized = input.toLowerCase().trim();
    return this.GENDER_MAPPINGS[normalized] || null;
  }

  private static parsePreferredSide(input: string): PreferredSide | null {
    if (!input?.trim()) return null;
    const normalized = input.toLowerCase().trim();
    return this.SIDE_MAPPINGS[normalized] || null;
  }

  private static parseScore(input: string, fieldName: string): number {
    if (!input?.trim()) {
      throw new Error(`${fieldName} is required`);
    }
    
    const score = parseFloat(input.trim());
    if (isNaN(score)) {
      throw new Error(`${fieldName} must be a number`);
    }
    
    if (score < 1 || score > 5) {
      throw new Error(`${fieldName} must be between 1 and 5`);
    }
    
    return Math.round(score); // Round to nearest integer
  }

  private static createColumnMapping(headers: string[]): { mapping: Record<string, number>, errors: string[] } {
    const errors: string[] = [];
    const mapping: Record<string, number> = {};

    // Define possible column name variations for each field
    const columnVariations = {
      name: ['name', 'paddler name', 'full name', 'paddler'],
      gender: ['gender', 'sex', 'male/female', 'gender (male/m/f/female/other/x)'],
      weight: ['weight', 'weight (kg)', 'weight(kg)', 'kg', 'body weight'],
      preferredSide: ['preferred side', 'side', 'preferred side (left/l/right/r/ambi/a)', 'side preference', 'paddling side'],
      strengthScore: ['strength', 'strength score', 'strength (1-5)', 'strength score (1-5)', 'str'],
      experienceScore: ['experience', 'experience score', 'experience (1-5)', 'experience score (1-5)', 'exp'],
    };

    // Find column indices for each field
    for (const [field, variations] of Object.entries(columnVariations)) {
      let foundIndex = -1;
      
      for (const variation of variations) {
        const index = headers.findIndex(h => h.includes(variation.toLowerCase()) || variation.toLowerCase().includes(h));
        if (index >= 0) {
          foundIndex = index;
          break;
        }
      }

      if (foundIndex >= 0) {
        mapping[field] = foundIndex;
      } else {
        errors.push(`Required column not found: ${field}. Expected one of: ${variations.join(', ')}`);
      }
    }

    return { mapping, errors };
  }

  private static parsePaddlerRowByColumn(line: string, rowNumber: number, columnMapping: Record<string, number>): Paddler | null {
    // Parse CSV line, handling quoted fields
    const fields = this.parseCSVLine(line);
    
    // Extract values using column mapping
    const name = fields[columnMapping.name]?.trim() || '';
    const gender = fields[columnMapping.gender]?.trim() || '';
    const weight = fields[columnMapping.weight]?.trim() || '';
    const preferredSide = fields[columnMapping.preferredSide]?.trim() || '';
    const strengthScore = fields[columnMapping.strengthScore]?.trim() || '';
    const experienceScore = fields[columnMapping.experienceScore]?.trim() || '';

    // Validate and parse required fields
    if (!name) {
      throw new Error('Name is required');
    }

    // Parse gender with flexible options
    const parsedGender = this.parseGender(gender);
    if (!parsedGender) {
      const validOptions = Object.keys(this.GENDER_MAPPINGS).join(', ');
      throw new Error(`Gender must be one of: ${validOptions} (case insensitive)`);
    }

    // Parse and validate weight
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum < 30 || weightNum > 200) {
      throw new Error('Weight must be a number between 30 and 200 kg');
    }

    // Parse preferred side with flexible options
    const parsedSide = this.parsePreferredSide(preferredSide);
    if (!parsedSide) {
      const validOptions = Object.keys(this.SIDE_MAPPINGS).join(', ');
      throw new Error(`Preferred Side must be one of: ${validOptions} (case insensitive)`);
    }

    // Parse scores with validation
    const strengthNum = this.parseScore(strengthScore, 'Strength Score');
    const experienceNum = this.parseScore(experienceScore, 'Experience Score');

    return {
      id: `csv_${Date.now()}_${rowNumber}`,
      name: name,
      gender: parsedGender,
      weight: weightNum,
      preferredSide: parsedSide,
      strengthScore: strengthNum,
      experienceScore: experienceNum,
    };
  }

  static createTemplate(): string {
    const headers = [
      'Name',
      'Gender (Male/M/F/Female/Other/X)',
      'Weight (kg)',
      'Preferred Side (Left/L/Right/R/Ambi/A)',
      'Strength Score (1-5)',
      'Experience Score (1-5)'
    ];

    const sampleData = [
      [
        'John Smith',
        'M',
        '75',
        'L',
        '4',
        '4'
      ],
      [
        'Sarah Johnson',
        'Female',
        '65',
        'Right',
        '3',
        '5'
      ],
      [
        'Mike Chen',
        'Male',
        '80',
        'A',
        '5',
        '3'
      ],
      [
        'Emma Wilson',
        'F',
        '60',
        'Left',
        '3',
        '4'
      ],
      [
        'Alex Rivera',
        'X',
        '70',
        'Either',
        '4',
        '3'
      ]
    ];

    const csvContent = [headers, ...sampleData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  static downloadTemplate(): void {
    const csvContent = this.createTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'paddlers_template.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  static parseCSV(csvText: string): { paddlers: Paddler[], errors: string[] } {
    const lines = csvText.trim().split('\n');
    const errors: string[] = [];
    const paddlers: Paddler[] = [];

    if (lines.length < 2) {
      errors.push('CSV file must contain at least a header row and one data row');
      return { paddlers, errors };
    }

    // Parse header row to get column mappings
    const headerLine = lines[0];
    const headers = this.parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
    
    // Create column mapping
    const columnMap = this.createColumnMapping(headers);
    if (columnMap.errors.length > 0) {
      errors.push(...columnMap.errors);
      return { paddlers, errors };
    }

    // Parse data rows
    const dataLines = lines.slice(1);

    dataLines.forEach((line, index) => {
      const rowNumber = index + 2; // +2 because we skipped header and arrays are 0-indexed
      
      try {
        const paddler = this.parsePaddlerRowByColumn(line, rowNumber, columnMap.mapping);
        if (paddler) {
          paddlers.push(paddler);
        }
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    return { paddlers, errors };
  }

  private static parsePaddlerRow(line: string, rowNumber: number): Paddler | null {
    // Parse CSV line, handling quoted fields
    const fields = this.parseCSVLine(line);
    
    if (fields.length < 6) {
      throw new Error(`Expected at least 6 columns, got ${fields.length}`);
    }

    const [name, gender, weight, preferredSide, strengthScore, experienceScore] = fields;

    // Validate and parse required fields
    if (!name?.trim()) {
      throw new Error('Name is required');
    }

    // Parse gender with flexible options
    const parsedGender = this.parseGender(gender);
    if (!parsedGender) {
      const validOptions = Object.keys(this.GENDER_MAPPINGS).join(', ');
      throw new Error(`Gender must be one of: ${validOptions} (case insensitive)`);
    }

    // Parse and validate weight
    const weightNum = parseFloat(weight?.trim() || '');
    if (isNaN(weightNum) || weightNum < 30 || weightNum > 200) {
      throw new Error('Weight must be a number between 30 and 200 kg');
    }

    // Parse preferred side with flexible options
    const parsedSide = this.parsePreferredSide(preferredSide);
    if (!parsedSide) {
      const validOptions = Object.keys(this.SIDE_MAPPINGS).join(', ');
      throw new Error(`Preferred Side must be one of: ${validOptions} (case insensitive)`);
    }

    // Parse scores with validation
    const strengthNum = this.parseScore(strengthScore, 'Strength Score');
    const experienceNum = this.parseScore(experienceScore, 'Experience Score');

    return {
      id: `csv_${Date.now()}_${rowNumber}`,
      name: name.trim(),
      gender: parsedGender,
      weight: weightNum,
      preferredSide: parsedSide,
      strengthScore: strengthNum,
      experienceScore: experienceNum,
    };
  }

  private static parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        fields.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Add the last field
    fields.push(current);

    return fields;
  }

  static validatePaddlerData(paddlers: Paddler[]): string[] {
    const warnings: string[] = [];
    const names = new Set<string>();

    paddlers.forEach((paddler, index) => {
      // Check for duplicate names
      if (names.has(paddler.name.toLowerCase())) {
        warnings.push(`Row ${index + 2}: Duplicate name "${paddler.name}"`);
      } else {
        names.add(paddler.name.toLowerCase());
      }
    });

    return warnings;
  }
}