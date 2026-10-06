import { Briefing } from '../types';

export const UNTAGGED_QUARTER_LABEL = 'Sem Trimestre Especificado';

export function formatQuarterLabel(quarter: number): string {
  return `${quarter}º Trimestre/051.2024`;
}

export function isQuarterMatch(trimestre: string | null | undefined, quarter: number): boolean {
  if (!trimestre) return false;
  const normalized = trimestre.trim().toLowerCase();
  return (
    normalized.startsWith(`${quarter}º`) ||
    normalized.startsWith(`${quarter}o`) ||
    normalized.includes(`${quarter}º trimestre`) ||
    normalized.includes(`${quarter}o trimestre`) ||
    normalized.includes(`trimestre ${quarter}`)
  );
}

export function extractQuarterNumber(trimestre: string | null | undefined): number | null {
  if (!trimestre) return null;
  const match = trimestre.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export function getDistinctQuarters(briefings: Briefing[]): string[] {
  const set = new Set<string>();
  for (const b of briefings) {
    if (b.trimestre?.trim()) {
      set.add(b.trimestre.trim());
    }
  }
  return Array.from(set).sort((a, b) => {
    const numA = extractQuarterNumber(a) ?? 0;
    const numB = extractQuarterNumber(b) ?? 0;
    return numB - numA;
  });
}

/**
 * Returns all historical quarter labels.
 * Includes ONLY quarters that were ACTUALLY created in the system (or present in briefings).
 * Never invents non-existent quarters.
 */
export function getAllHistoricalQuarters(
  briefings: Briefing[],
  createdQuarterNumbers: number[] = [],
  activeQuarter = 8,
  isPaused = false
): string[] {
  const set = new Set<string>();
  const allCreated = new Set<number>(createdQuarterNumbers);

  // Add any quarters that actually appear in existing briefings
  for (const b of briefings) {
    const qNum = extractQuarterNumber(b.trimestre);
    if (qNum !== null) {
      allCreated.add(qNum);
    } else if (b.trimestre?.trim()) {
      set.add(b.trimestre.trim());
    }
  }

  // If no created quarters were provided, but the system is paused, ensure activeQuarter is included
  if (allCreated.size === 0 && isPaused) {
    allCreated.add(activeQuarter);
  }

  // Add created quarters to history if they are closed (i.e. not the active one unless paused)
  for (const qNum of allCreated) {
    if (!isPaused && qNum === activeQuarter) {
      continue;
    }
    set.add(formatQuarterLabel(qNum));
  }

  return Array.from(set).sort((a, b) => {
    const numA = extractQuarterNumber(a) ?? 0;
    const numB = extractQuarterNumber(b) ?? 0;
    return numB - numA;
  });
}
