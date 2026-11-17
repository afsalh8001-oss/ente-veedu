import { FestivalId } from '../types/village';

export interface FestivalConfig {
  id: FestivalId;
  en: string;
  ml: string;
  goalLabelEn: string;
  goalLabelMl: string;
  actionLabelEn: string;
  actionLabelMl: string;
  targetCount: number;
  // Inclusive MM-DD ranges (month 1-12, day 1-31)
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

export const FESTIVAL_CONFIGS: FestivalConfig[] = [
  {
    id: 'onam',
    en: 'Onam Mahotsavam',
    ml: 'ഓണം മഹോത്സവം',
    goalLabelEn: 'Lay 500 Pookalam flowers for Onam',
    goalLabelMl: 'ഓണത്തിനായി 500 പൂക്കൾ അർപ്പിക്കൂ',
    actionLabelEn: 'Add Flower',
    actionLabelMl: 'പൂവ് ഇടൂ',
    targetCount: 500,
    startMonth: 8,
    startDay: 24,
    endMonth: 9,
    endDay: 6,
  },
  {
    id: 'vishu',
    en: 'Vishu Kani Festival',
    ml: 'വിഷുക്കണി ഉത്സവം',
    goalLabelEn: 'Light 500 lamps for Vishu',
    goalLabelMl: 'വിഷുവിനായി 500 ദീപങ്ങൾ തെളിയിക്കൂ',
    actionLabelEn: 'Light Lamp',
    actionLabelMl: 'ദീപം തെളിക്കൂ',
    targetCount: 500,
    startMonth: 4,
    startDay: 13,
    endMonth: 4,
    endDay: 16,
  },
  {
    id: 'pooram',
    en: 'Thrissur Pooram',
    ml: 'തൃശ്ശൂർ പൂരം',
    goalLabelEn: 'Raise 500 parasols for Pooram',
    goalLabelMl: 'പൂരത്തിനായി 500 മുത്തുക്കുടകൾ ഉയർത്തൂ',
    actionLabelEn: 'Raise Parasol',
    actionLabelMl: 'കുട ഉയർത്തൂ',
    targetCount: 500,
    startMonth: 4,
    startDay: 26,
    endMonth: 5,
    endDay: 4,
  },
  {
    id: 'christmas',
    en: 'Kerala Christmas',
    ml: 'ക്രിസ്മസ് നക്ഷത്രോത്സവം',
    goalLabelEn: 'Hang 500 star lanterns for Christmas',
    goalLabelMl: 'ക്രിസ്മസിനായി 500 നക്ഷത്രവിളക്കുകൾ തൂക്കൂ',
    actionLabelEn: 'Hang Star',
    actionLabelMl: 'നക്ഷത്രം തൂക്കൂ',
    targetCount: 500,
    startMonth: 12,
    startDay: 22,
    endMonth: 12,
    endDay: 27,
  },
];

export function getActiveFestival(
  date = new Date(),
  overrideId?: FestivalId | null
): FestivalConfig | null {
  if (overrideId) {
    return FESTIVAL_CONFIGS.find((f) => f.id === overrideId) || null;
  }
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const md = m * 100 + d;

  for (const fest of FESTIVAL_CONFIGS) {
    const start = fest.startMonth * 100 + fest.startDay;
    const end = fest.endMonth * 100 + fest.endDay;
    if (md >= start && md <= end) {
      return fest;
    }
  }
  return null;
}

export function getCurrentMonthKey(date = new Date()): string {
  const m = date.getMonth() + 1;
  return `${date.getFullYear()}-${m < 10 ? `0${m}` : m}`;
}
