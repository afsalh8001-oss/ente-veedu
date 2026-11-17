import {
  AccessoryId,
  BuildingDoc,
  BuildingType,
  FurnitureId,
  Language,
  OutfitType,
  TownStageId,
} from '../types/village';

export type BuildingCategory = 'civic' | 'commerce' | 'culture' | 'leisure';

export interface TownBuildingConfig {
  type: BuildingType;
  en: string;
  ml: string;
  descEn: string;
  descMl: string;
  category: BuildingCategory;
  unlockStage: TownStageId;
  unlockStageIndex: number; // 1=Panchayat, 2=Town, 3=Municipality, 4=City
  x: number;
  y: number;
  openHour: number; // 0-23 inclusive
  closeHour: number; // 1-24 exclusive (e.g. 24 = open 24h when openHour=0)
  hoursEn: string;
  hoursMl: string;
}

export const TOWN_BUILDINGS: TownBuildingConfig[] = [
  // Stage 1: Panchayat (100+ residents)
  {
    type: 'school',
    en: 'Village School',
    ml: 'പള്ളിക്കൂടം',
    descEn: 'Take the daily Kerala GK & Math quiz to earn +10 coins.',
    descMl: 'ദിവസേനയുള്ള കേരള ക്വിസും കണക്കും ജയിച്ച് +10 നാണയങ്ങൾ നേടൂ.',
    category: 'civic',
    unlockStage: 'panchayat',
    unlockStageIndex: 1,
    x: 1,
    y: -4,
    openHour: 8,
    closeHour: 17,
    hoursEn: '08:00 – 17:00',
    hoursMl: '08:00 – 17:00',
  },
  {
    type: 'hospital',
    en: 'Community Hospital',
    ml: 'ആശുപത്രി',
    descEn: 'Check your health meter and get healed by Dr. Meera & Nurse Arun.',
    descMl: 'ആരോഗ്യനില പരിശോധിച്ച് ഡോ. മീരയുടെയും നഴ്‌സ് അരുണിന്റെയും ചികിത്സ തേടൂ.',
    category: 'civic',
    unlockStage: 'panchayat',
    unlockStageIndex: 1,
    x: 3,
    y: -5,
    openHour: 0,
    closeHour: 24,
    hoursEn: 'Open 24 Hours',
    hoursMl: '24 മണിക്കൂറും തുറന്നിരിക്കും',
  },
  {
    type: 'post_office',
    en: 'Kerala Post Office',
    ml: 'തപാൽ ഓഫീസ്',
    descEn: 'Send illustrated Kerala postcards to neighbours across the village.',
    descMl: 'നാട്ടുകാർക്ക് മനോഹരമായ കേരള പോസ്റ്റ്കാർഡുകൾ അയക്കൂ.',
    category: 'civic',
    unlockStage: 'panchayat',
    unlockStageIndex: 1,
    x: -1,
    y: -4,
    openHour: 9,
    closeHour: 18,
    hoursEn: '09:00 – 18:00',
    hoursMl: '09:00 – 18:00',
  },
  {
    type: 'bank',
    en: 'Village Co-op Bank',
    ml: 'സഹകരണ ബാങ്ക്',
    descEn: 'Deposit coins safely in your vault and claim 5% daily interest.',
    descMl: 'നാണയങ്ങൾ സുരക്ഷിതമായി നിക്ഷേപിച്ച് ദിവസേന 5% പലിശ നേടൂ.',
    category: 'commerce',
    unlockStage: 'panchayat',
    unlockStageIndex: 1,
    x: -4,
    y: -4,
    openHour: 9,
    closeHour: 17,
    hoursEn: '09:00 – 17:00',
    hoursMl: '09:00 – 17:00',
  },
  {
    type: 'library',
    en: 'Vayanasala Library',
    ml: 'വായനശാല',
    descEn: 'Read Kerala proverbs, backwater history, and quiet stories.',
    descMl: 'പഴഞ്ചൊല്ലുകളും കേരളത്തിന്റെ കഥകളും വായിച്ചറിയൂ.',
    category: 'culture',
    unlockStage: 'panchayat',
    unlockStageIndex: 1,
    x: -4,
    y: -1,
    openHour: 8,
    closeHour: 20,
    hoursEn: '08:00 – 20:00',
    hoursMl: '08:00 – 20:00',
  },
  {
    type: 'bakery',
    en: 'Hot Kerala Bakery',
    ml: 'കേരള ബേക്കറി',
    descEn: 'Warm banana chips, Kozhikode halwa & tea puffs to restore energy.',
    descMl: 'ചൂട് കായ വറുത്തതും കോഴിക്കോടൻ ഹൽവയും വാങ്ങൂ.',
    category: 'commerce',
    unlockStage: 'panchayat',
    unlockStageIndex: 1,
    x: 4,
    y: 1,
    openHour: 6,
    closeHour: 22,
    hoursEn: '06:00 – 22:00',
    hoursMl: '06:00 – 22:00',
  },
  {
    type: 'market',
    en: 'Chanthakkavala Market',
    ml: 'ഗ്രാമച്ചന്ത',
    descEn: 'Fresh cardamom, Malabar pepper, and seasonal plantains.',
    descMl: 'ഏലക്കയും കുരുമുളകും നാടൻ പഴങ്ങളും നിറഞ്ഞ ചന്ത.',
    category: 'commerce',
    unlockStage: 'panchayat',
    unlockStageIndex: 1,
    x: 5,
    y: -1,
    openHour: 6,
    closeHour: 20,
    hoursEn: '06:00 – 20:00',
    hoursMl: '06:00 – 20:00',
  },
  {
    type: 'temple',
    en: 'Sri Temple & Kulam',
    ml: 'ക്ഷേത്രവും കുളവും',
    descEn: 'Light the brass lamp, ring the temple bell & receive serene blessings.',
    descMl: 'നിലവിളക്ക് കൊളുത്തി മണി മുഴക്കി പ്രാർത്ഥിക്കൂ.',
    category: 'culture',
    unlockStage: 'panchayat',
    unlockStageIndex: 1,
    x: -5,
    y: -2,
    openHour: 5,
    closeHour: 21,
    hoursEn: '05:00 – 21:00',
    hoursMl: '05:00 – 21:00',
  },
  {
    type: 'church',
    en: 'St. Thomas Church',
    ml: 'സെന്റ് തോമസ് പള്ളി',
    descEn: 'Light a prayer candle and chime the coastal belfry.',
    descMl: 'മെഴുകുതിരി തെളിയിച്ച് പള്ളിമണി മുഴക്കൂ.',
    category: 'culture',
    unlockStage: 'panchayat',
    unlockStageIndex: 1,
    x: -5,
    y: 3,
    openHour: 6,
    closeHour: 20,
    hoursEn: '06:00 – 20:00',
    hoursMl: '06:00 – 20:00',
  },
  {
    type: 'mosque',
    en: 'Juma Masjid',
    ml: 'ജുമാ മസ്ജിദ്',
    descEn: 'Peaceful courtyard fountain, crescent lantern & charity box.',
    descMl: 'ശാന്തമായ മുറ്റവും പ്രാർത്ഥനാ ഹാളും സന്ദർശിക്കൂ.',
    category: 'culture',
    unlockStage: 'panchayat',
    unlockStageIndex: 1,
    x: 5,
    y: 3,
    openHour: 5,
    closeHour: 22,
    hoursEn: '05:00 – 22:00',
    hoursMl: '05:00 – 22:00',
  },

  // Stage 2: Pattanam / Town (500+ residents)
  {
    type: 'police_station',
    en: 'Janamaithri Police Station',
    ml: 'ജനമൈത്രി പോലീസ് സ്റ്റേഷൻ',
    descEn: 'Safety watch desk, lost & found board, and village escort home.',
    descMl: 'സുരക്ഷാ വിവരങ്ങളും നഷ്ടപ്പെട്ട സാധനങ്ങളുടെ വിവരങ്ങളും ഇവിടെ.',
    category: 'civic',
    unlockStage: 'town',
    unlockStageIndex: 2,
    x: 4,
    y: -5,
    openHour: 0,
    closeHour: 24,
    hoursEn: 'Open 24 Hours',
    hoursMl: '24 മണിക്കൂറും തുറന്നിരിക്കും',
  },
  {
    type: 'fish_stall',
    en: 'Fresh Backwater Fish Stall',
    ml: 'മീൻ സ്റ്റാൾ',
    descEn: 'Fresh Karimeen pearl-spot & coastal catch for stamina.',
    descMl: 'കായലിലെ ഫ്രഷ് കരിമീനും മീൻ വിഭവങ്ങളും വാങ്ങൂ.',
    category: 'commerce',
    unlockStage: 'town',
    unlockStageIndex: 2,
    x: 3,
    y: 5,
    openHour: 6,
    closeHour: 15,
    hoursEn: '06:00 – 15:00',
    hoursMl: '06:00 – 15:00',
  },
  {
    type: 'petrol_pump',
    en: 'Highway Petrol Bunk',
    ml: 'പെട്രോൾ പമ്പ്',
    descEn: 'Top up diesel for the KSRTC bus and grab highway masala chai.',
    descMl: 'KSRTC ബസ്സിന് ഇന്ധനം നിറയ്ക്കൂ, ചായ കുടിക്കൂ.',
    category: 'commerce',
    unlockStage: 'town',
    unlockStageIndex: 2,
    x: -4,
    y: 4,
    openHour: 0,
    closeHour: 24,
    hoursEn: 'Open 24 Hours',
    hoursMl: '24 മണിക്കൂറും തുറന്നിരിക്കും',
  },
  {
    type: 'park',
    en: 'Municipal Park',
    ml: 'മുനിസിപ്പൽ പാർക്ക്',
    descEn: 'Rest beside the lotus fountain and regain health under shady banyans.',
    descMl: 'പൂന്തോട്ടത്തിൽ വിശ്രമിച്ച് ആരോഗ്യം വീണ്ടെടുക്കൂ.',
    category: 'leisure',
    unlockStage: 'town',
    unlockStageIndex: 2,
    x: 0,
    y: 4,
    openHour: 5,
    closeHour: 21,
    hoursEn: '05:00 – 21:00',
    hoursMl: '05:00 – 21:00',
  },
  {
    type: 'stadium',
    en: 'Town Sports Stadium',
    ml: 'ടൗൺ സ്റ്റേഡിയം',
    descEn: 'Play Penalty Shootout & Coconut Tree Climb mini-games (watch your step!).',
    descMl: 'പെനാൽറ്റി ഷൂട്ടൗട്ടും തെങ്ങ് കയറ്റ മത്സരവും കളിക്കൂ!',
    category: 'leisure',
    unlockStage: 'town',
    unlockStageIndex: 2,
    x: 6,
    y: -5,
    openHour: 6,
    closeHour: 22,
    hoursEn: '06:00 – 22:00',
    hoursMl: '06:00 – 22:00',
  },

  // Stage 3: Municipality (3,000+ residents)
  {
    type: 'cinema_theatre',
    en: 'Sree Cinema Talkies',
    ml: 'ശ്രീ സിനിമാ കൊട്ടക',
    descEn: 'Hourly procedural Kerala showcase film — pick a seat & chat live together.',
    descMl: 'മണിക്കൂറുകൾ തോറുമുള്ള സിനിമ സീറ്റിൽ ഇരുന്ന് ഒരുമിച്ച് കാണാം.',
    category: 'leisure',
    unlockStage: 'municipality',
    unlockStageIndex: 3,
    x: 6,
    y: 1,
    openHour: 9,
    closeHour: 24,
    hoursEn: '09:00 – 24:00',
    hoursMl: '09:00 – 24:00',
  },
  {
    type: 'mall',
    en: 'Village Centre Mall',
    ml: 'വില്ലേജ് സെന്റർ മാൾ',
    descEn: 'Ride the escalator to clothes, accessories, house furniture & Food Court.',
    descMl: 'എസ്കലേറ്ററിൽ കയറി വസ്ത്രങ്ങൾ, ഫർണിച്ചർ, ഫുഡ് കോർട്ട് എന്നിവ സന്ദർശിക്കൂ.',
    category: 'commerce',
    unlockStage: 'municipality',
    unlockStageIndex: 3,
    x: 6,
    y: 4,
    openHour: 10,
    closeHour: 22,
    hoursEn: '10:00 – 22:00',
    hoursMl: '10:00 – 22:00',
  },

  // Stage 4: Nagaram City (20,000+ residents)
  {
    type: 'beach',
    en: 'Kovalam Promenade Beach',
    ml: 'കടൽത്തീരം',
    descEn: 'Stroll on golden sands, listen to waves, and collect seashells.',
    descMl: 'കടൽത്തീരത്ത് തിരമാലകൾ കണ്ടു നടക്കൂ, കക്കകൾ ശേഖരിക്കൂ.',
    category: 'leisure',
    unlockStage: 'city',
    unlockStageIndex: 4,
    x: 4,
    y: 9,
    openHour: 5,
    closeHour: 23,
    hoursEn: '05:00 – 23:00',
    hoursMl: '05:00 – 23:00',
  },
  {
    type: 'lighthouse',
    en: 'Nagaram Lighthouse',
    ml: 'വിളക്കുമാടം',
    descEn: 'Climb the spiral stairs to look through the coastal telescope.',
    descMl: 'വിളക്കുമാടത്തിന്റെ മുകളിൽ കയറി ദൂരദർശിനിയിലൂടെ നാട് കാണൂ.',
    category: 'leisure',
    unlockStage: 'city',
    unlockStageIndex: 4,
    x: 7,
    y: 9,
    openHour: 7,
    closeHour: 20,
    hoursEn: '07:00 – 20:00',
    hoursMl: '07:00 – 20:00',
  },
];

export function getTownBuildingConfig(type: string): TownBuildingConfig | null {
  return TOWN_BUILDINGS.find((b) => b.type === type) || null;
}

export function isTownBuildingCoord(x: number, y: number): boolean {
  return TOWN_BUILDINGS.some((b) => b.x === x && b.y === y);
}

export function getBuildingOpenStatus(
  cfg: TownBuildingConfig | null,
  nowDate = new Date(),
  ignoreHours = false
): {
  isOpen: boolean;
  is24h: boolean;
  hoursLabel: (lang: Language) => string;
  currentHour: number;
} {
  if (!cfg) {
    return {
      isOpen: true,
      is24h: true,
      hoursLabel: (lang) => (lang === 'ml' ? '24 മണിക്കൂറും തുറന്നിരിക്കും' : 'Open 24 Hours'),
      currentHour: nowDate.getHours(),
    };
  }
  const is24h = cfg.openHour === 0 && cfg.closeHour === 24;
  const hour = nowDate.getHours();
  const isOpen = ignoreHours || is24h || (hour >= cfg.openHour && hour < cfg.closeHour);
  return {
    isOpen,
    is24h,
    hoursLabel: (lang) => (lang === 'ml' ? cfg.hoursMl : cfg.hoursEn),
    currentHour: hour,
  };
}

/**
 * Merges Firestore/Demo constructed buildings with stage-unlocked Town District buildings.
 * Built community landmarks take precedence if their type already appears in `buildings`.
 */
export function getVisibleTownBuildings(
  constructedBuildings: BuildingDoc[],
  townStageIndex: number
): { building: BuildingDoc; config: TownBuildingConfig | null; isUnlocked: boolean; isConstructedLandmark: boolean }[] {
  const result: {
    building: BuildingDoc;
    config: TownBuildingConfig | null;
    isUnlocked: boolean;
    isConstructedLandmark: boolean;
  }[] = [];

  const seenTypes = new Set<string>();

  for (const b of constructedBuildings) {
    seenTypes.add(b.type);
    const cfg = getTownBuildingConfig(b.type);
    result.push({
      building: b,
      config: cfg,
      isUnlocked: true, // Community-built landmarks are always open right away
      isConstructedLandmark: true,
    });
  }

  for (const cfg of TOWN_BUILDINGS) {
    if (seenTypes.has(cfg.type)) continue;
    const isUnlocked = townStageIndex >= cfg.unlockStageIndex;
    result.push({
      building: {
        id: `town_${cfg.type}`,
        type: cfg.type,
        label: cfg.en,
        x: cfg.x,
        y: cfg.y,
        builtByUid: 'town',
        builtAt: 0,
      },
      config: cfg,
      isUnlocked,
      isConstructedLandmark: false,
    });
  }

  return result;
}

// ---------- Mall Catalogs ----------

export interface MallOutfitOption {
  id: string;
  outfitType: OutfitType;
  outfitColor: string;
  price: number;
  en: string;
  ml: string;
}

export interface MallAccessoryOption {
  id: AccessoryId;
  itemId: string;
  price: number;
  en: string;
  ml: string;
  icon: string;
}

export interface MallFurnitureOption {
  id: FurnitureId;
  itemId: string;
  price: number;
  en: string;
  ml: string;
  descEn: string;
  descMl: string;
}

export interface MallFoodOption {
  id: string;
  price: number;
  heal: number;
  en: string;
  ml: string;
  icon: string;
}

export const MALL_CLOTHES: MallOutfitOption[] = [
  { id: 'cloth_kasavu_mundu', outfitType: 'mundu', outfitColor: '#fef3c7', price: 12, en: 'Onam Kasavu Mundu', ml: 'കസവ് മുണ്ട്' },
  { id: 'cloth_indigo_shirt', outfitType: 'shirt', outfitColor: '#1d4ed8', price: 14, en: 'Malabar Indigo Shirt', ml: 'നീല ഷർട്ട്' },
  { id: 'cloth_crimson_sari', outfitType: 'sari', outfitColor: '#be123c', price: 16, en: 'Kanchipuram Silk Sari', ml: 'പട്ടുസാരി' },
  { id: 'cloth_emerald_sari', outfitType: 'sari', outfitColor: '#047857', price: 16, en: 'Emerald Silk Sari', ml: 'പച്ച പട്ടുസാരി' },
  { id: 'cloth_saffron_shirt', outfitType: 'shirt', outfitColor: '#d97706', price: 14, en: 'Festive Kurta Shirt', ml: 'കുർത്ത ഷർട്ട്' },
];

export const MALL_ACCESSORIES: MallAccessoryOption[] = [
  { id: 'sunglasses', itemId: 'acc_sunglasses', price: 10, en: 'Cool Sunglasses', ml: 'സൺഗ്ലാസ്', icon: '🕶️' },
  { id: 'cap', itemId: 'acc_cap', price: 10, en: 'Kochi Harbour Cap', ml: 'തൊപ്പി', icon: '🧢' },
  { id: 'garland', itemId: 'acc_garland', price: 12, en: 'Jasmine Mulla Poo', ml: 'മുല്ലപ്പൂ', icon: '🌼' },
  { id: 'umbrella', itemId: 'acc_umbrella', price: 15, en: 'Monsoon Kuda Umbrella', ml: 'കാലൻകുട', icon: '☂️' },
  { id: 'gold_chain', itemId: 'acc_gold_chain', price: 25, en: 'Kasumala Gold Chain', ml: 'സ്വർണ്ണമാല', icon: '📿' },
];

export const MALL_FURNITURE: MallFurnitureOption[] = [
  { id: 'brass_uruli', itemId: 'furn_brass_uruli', price: 15, en: 'Floating Flower Uruli', ml: 'ഓട്ടുരുളി', descEn: 'Water bowl with marigolds', descMl: 'പൂക്കൾ ഇട്ട ഓട്ടുരുളി' },
  { id: 'wooden_swing', itemId: 'furn_wooden_swing', price: 22, en: 'Rosewood Veranda Chair', ml: 'ചാരുകസേര', descEn: 'Classic Kerala easy-chair', descMl: 'ഈട്ടി ചാരുകസേര' },
  { id: 'teak_sofa', itemId: 'furn_teak_sofa', price: 28, en: 'Nilambur Teak Settee', ml: 'തേക്ക് സോഫ', descEn: 'Polished teakwood seating', descMl: 'നിലമ്പൂർ തേക്ക് സോഫ' },
  { id: 'reading_lamp', itemId: 'furn_reading_lamp', price: 14, en: 'Warm Porch Lantern', ml: 'റാന്തൽ വിളക്ക്', descEn: 'Cozy golden veranda glow', descMl: 'മുറ്റത്തെ വിളക്ക്' },
  { id: 'clay_planter', itemId: 'furn_clay_planter', price: 12, en: 'Terracotta Hibiscus Pot', ml: 'ചെമ്പരത്തി ചട്ടി', descEn: 'Red laterite garden pot', descMl: 'ചുവന്ന ചെടിച്ചട്ടി' },
  { id: 'wall_clock', itemId: 'furn_wall_clock', price: 18, en: 'Heritage Chime Clock', ml: 'തറവാട് ക്ലോക്ക്', descEn: 'Antique wooden timepiece', descMl: 'തടി ക്ലോക്ക്' },
];

export const MALL_FOOD_ITEMS: MallFoodOption[] = [
  { id: 'food_chips', price: 4, heal: 18, en: 'Hot Banana Chips & Chai', ml: 'കായ വറുത്തതും ചായയും', icon: '🍌' },
  { id: 'food_pazham', price: 6, heal: 30, en: 'Pazham Pori Combo', ml: 'പഴംപൊരി കോംബോ', icon: '🥐' },
  { id: 'food_sadya', price: 10, heal: 55, en: 'Mini Kerala Sadya Plate', ml: 'മിനി സദ്യ', icon: '🍃' },
];

// ---------- School Daily Quiz Bank ----------

export interface QuizQuestion {
  qEn: string;
  qMl: string;
  optionsEn: [string, string, string];
  optionsMl: [string, string, string];
  correctIdx: number;
}

export const SCHOOL_QUIZ_BANK: QuizQuestion[] = [
  {
    qEn: 'Which lake is the longest lake in Kerala?',
    qMl: 'കേരളത്തിലെ ഏറ്റവും വലിയ കായൽ ഏതാണ്?',
    optionsEn: ['Vembanad Lake', 'Ashtamudi Lake', 'Sasthamkotta Lake'],
    optionsMl: ['വേമ്പനാട് കായൽ', 'അഷ്ടമുടി കായൽ', 'ശാസ്താംകോട്ട കായൽ'],
    correctIdx: 0,
  },
  {
    qEn: 'What is 14 × 6 − 9?',
    qMl: '14 × 6 − 9 എത്രയാണ്?',
    optionsEn: ['72', '75', '84'],
    optionsMl: ['72', '75', '84'],
    correctIdx: 1,
  },
  {
    qEn: 'Which flower is officially Kerala’s State Flower?',
    qMl: 'കേരളത്തിന്റെ ഔദ്യോഗിക സംസ്ഥാന പുഷ്പം ഏതാണ്?',
    optionsEn: ['Lotus', 'Kanikonna', 'Hibiscus'],
    optionsMl: ['താമര', 'കണിക്കൊന്ന', 'ചെമ്പരത്തി'],
    correctIdx: 1,
  },
  {
    qEn: 'What is 125 ÷ 5 + 18?',
    qMl: '125 ÷ 5 + 18 എത്രയാണ്?',
    optionsEn: ['43', '38', '48'],
    optionsMl: ['43', '38', '48'],
    correctIdx: 0,
  },
  {
    qEn: 'Which river is known as Kerala’s longest river?',
    qMl: 'കേരളത്തിലെ ഏറ്റവും നീളം കൂടിയ നദി ഏതാണ്?',
    optionsEn: ['Bharathapuzha', 'Periyar', 'Pamba'],
    optionsMl: ['ഭാരതപ്പുഴ', 'പെരിയാർ', 'പമ്പ'],
    correctIdx: 1,
  },
  {
    qEn: 'How many districts does Kerala have?',
    qMl: 'കേരളത്തിൽ എത്ര ജില്ലകളുണ്ട്?',
    optionsEn: ['12', '14', '16'],
    optionsMl: ['12', '14', '16'],
    correctIdx: 1,
  },
  {
    qEn: 'What is the perimeter of a square house plot with side 12m?',
    qMl: '12 മീറ്റർ വശമുള്ള ചതുരാകൃതിയിലുള്ള വീട്ടുപറമ്പിന്റെ ചുറ്റളവ് എത്ര?',
    optionsEn: ['36 m', '48 m', '144 m'],
    optionsMl: ['36 മീ', '48 മീ', '144 മീ'],
    correctIdx: 1,
  },
  {
    qEn: 'Which classical Kerala art form uses colourful face paint and crowns?',
    qMl: 'മുഖത്തെഴുത്തും കിരീടവും ഉപയോഗിക്കുന്ന കേരളത്തിലെ ക്ലാസിക്കൽ കല ഏത്?',
    optionsEn: ['Kathakali', 'Kalaripayattu', 'Thiruvathira'],
    optionsMl: ['കഥകളി', 'കളരിപ്പയറ്റ്', 'തിരുവാതിര'],
    correctIdx: 0,
  },
  {
    qEn: 'If a boat rows 8 km/h for 3 hours, how far does it travel?',
    qMl: 'മണിക്കൂറിൽ 8 കി.മീ വേഗതയിൽ 3 മണിക്കൂർ തുഴഞ്ഞാൽ വള്ളം എത്ര ദൂരം പോകും?',
    optionsEn: ['21 km', '24 km', '28 km'],
    optionsMl: ['21 കി.മീ', '24 കി.മീ', '28 കി.മീ'],
    correctIdx: 1,
  },
];

export function getTodaysQuizQuestions(dateKey: string): QuizQuestion[] {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  const picked: QuizQuestion[] = [];
  for (let i = 0; i < 3; i++) {
    picked.push(SCHOOL_QUIZ_BANK[(hash + i * 2) % SCHOOL_QUIZ_BANK.length]);
  }
  return picked;
}

export function getCurrentHourKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hr = String(d.getHours()).padStart(2, '0');
  return `${y}-${m}-${day}-${hr}`;
}
