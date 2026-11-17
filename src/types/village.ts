export type Language = 'en' | 'ml';

export type HouseStyle = 'tiled' | 'nalukettu' | 'modern' | 'tharavad';
export type OutfitType = 'mundu' | 'sari' | 'shirt';

export type TownStageId = 'gramam' | 'panchayat' | 'town' | 'municipality' | 'city';
export type ShopType = 'bakery' | 'tailor' | 'fish_stall' | 'chaya_kada' | 'flower_shop';
export type FestivalId = 'onam' | 'vishu' | 'pooram' | 'christmas';

export type YardAddition =
  | 'coconutTree'
  | 'vegGarden'
  | 'cowShed'
  | 'swing'
  | 'rangoli'
  | 'pookalam'
  | 'nilavilakku'
  | 'tulsiThara'
  | 'bananaGrove'
  | 'rooster'
  | 'goat'
  | 'smallBoat';

export type DailyTaskId = 'waterTree' | 'feedCow' | 'sweepYard' | 'lightLamp';
export type EmoteType = 'wave' | 'laugh' | 'heart' | 'cheers';
export type VallamTeam = 'chundan_red' | 'backwater_blue' | 'paddy_green' | 'coconut_gold';

export type BuildingType =
  | 'temple'
  | 'church'
  | 'mosque'
  | 'school'
  | 'panchayat_office'
  | 'bus_stand'
  | 'railway_station'
  | 'ferry_jetty'
  | 'houseboat_dock'
  | 'stadium'
  | 'market'
  | 'hospital'
  | 'library'
  | 'beach'
  | 'lighthouse'
  | 'tea_estate'
  | 'waterfall'
  | 'cinema_theatre'
  | 'chaya_kada'
  | 'kalari'
  | 'boat_race_canal'
  | 'mall'
  | 'police_station'
  | 'post_office'
  | 'bank'
  | 'bakery'
  | 'petrol_pump'
  | 'fish_stall'
  | 'park';

export type AccessoryId =
  | 'none'
  | 'sunglasses'
  | 'cap'
  | 'garland'
  | 'umbrella'
  | 'gold_chain';

export type FurnitureId =
  | 'wooden_swing'
  | 'brass_uruli'
  | 'teak_sofa'
  | 'reading_lamp'
  | 'clay_planter'
  | 'wall_clock';

export interface PlayerDoc {
  uid: string;
  username: string;
  plotX: number;
  plotY: number;
  houseStyle: HouseStyle;
  roofColor: string;
  wallColor: string;
  skinTone: string;
  outfitType: OutfitType;
  outfitColor: string;
  additions: YardAddition[];
  heartsCount: number;
  coins: number;
  streak: number;
  lastClaimDate?: string;
  dailyTasks?: DailyTaskId[];
  dailyCoinsDate?: string;
  dailyCoinsEarned?: number;
  claimedMilestones?: number[];
  unlockedItems?: string[];
  claimedRaceDates?: string[];
  boatBadgeUntil?: number;
  wateredDate?: string;
  fedCowDate?: string;
  sweptDate?: string;
  litLampDate?: string;
  // Shops, Work Shift & Mayor Nameplate
  shopType?: ShopType;
  shopIncomeDate?: string;
  shopIncomeToday?: number;
  workShiftDate?: string;
  mayorMonth?: string;
  lastClaimedOrderId?: string;
  // Functional Town Buildings state
  health?: number;
  lastInjuryReason?: string;
  bankBalance?: number;
  lastInterestDate?: string;
  quizDate?: string;
  accessory?: AccessoryId;
  furniture?: FurnitureId[];
  lastRestDate?: string;
  lastChatAt?: number;
  lastEmote?: EmoteType;
  lastEmoteAt?: number;
  lastWaveAt?: number;
  lastSuggestionAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface SuggestionDoc {
  id: string;
  text: string;
  buildingType: string;
  authorUid: string;
  authorUsername: string;
  votes: number;
  status: 'open' | 'built' | 'archived';
  createdAt: number;
  updatedAt: number;
}

export interface BuildingDoc {
  id: string;
  type: BuildingType | string;
  label: string;
  x: number;
  y: number;
  suggestionId?: string;
  electionMonth?: string;
  builtByUid: string;
  builtAt: number;
}

export type PostcardStamp = 'houseboat' | 'kathakali' | 'palm' | 'lighthouse';

export interface PostcardDoc {
  id: string;
  senderUid: string;
  senderUsername: string;
  recipientUid: string;
  recipientUsername: string;
  stamp: PostcardStamp;
  message: string;
  read: boolean;
  createdAt: number;
}

export interface CinemaSeatDoc {
  uid: string;
  username: string;
  row: number;
  col: number;
  updatedAt: number;
}

export interface CinemaChatDoc {
  id: string;
  authorUid: string;
  authorUsername: string;
  text: string;
  hourKey: string;
  createdAt: number;
}

export interface DoorMessageDoc {
  id: string;
  targetUid: string;
  authorUid: string;
  authorUsername: string;
  message: string;
  createdAt: number;
}

export interface ChatMessageDoc {
  id: string;
  authorUid: string;
  authorUsername: string;
  text: string;
  createdAt: number;
}

export interface ChayaPresenceDoc {
  uid: string;
  username: string;
  lastSeen: number;
}

export interface ChatReportDoc {
  id: string;
  messageId: string;
  reportedUid: string;
  reportedUsername: string;
  messageText: string;
  reporterUid: string;
  createdAt: number;
}

export interface RaceScores {
  chundan_red: number;
  backwater_blue: number;
  paddy_green: number;
  coconut_gold: number;
}

export interface RaceDoc {
  id: string;
  date: string;
  status: 'live' | 'finished';
  scores: RaceScores;
  winnerTeam?: VallamTeam;
  participantCount: number;
  startedAt: number;
  finishedAt?: number;
}

export interface RaceParticipantDoc {
  uid: string;
  username: string;
  team: VallamTeam;
  taps: number;
  joinedAt: number;
}

export interface WardStatDoc {
  id: string; // `${weekKey}_${wardId}`
  weekKey: string;
  wardId: number;
  tasksCompleted: number;
  decorCoinsSpent: number;
  updatedAt: number;
}

export interface ShopOrderDoc {
  id: string;
  buyerUid: string;
  buyerUsername: string;
  sellerUid: string;
  shopType: ShopType;
  amount: number;
  dateKey: string;
  claimed: boolean;
  createdAt: number;
}

export interface ElectionDoc {
  month: string; // YYYY-MM
  status: 'open' | 'closed';
  winnerUid?: string;
  winnerUsername?: string;
  winnerVotes?: number;
  mayorUsedBuild?: boolean;
  startedAt: number;
  closedAt?: number;
}

export interface ElectionCandidateDoc {
  uid: string;
  username: string;
  manifesto: string;
  votes: number;
  createdAt: number;
}

export interface ElectionVoteDoc {
  voterUid: string;
  candidateUid: string;
  createdAt: number;
}

export interface FestivalProgressDoc {
  id: string; // `${year}_${festivalId}`
  festivalId: FestivalId;
  count: number;
  updatedAt: number;
}

export type NewsCategory = 'stage' | 'building' | 'race' | 'mayor' | 'ward' | 'festival';

export interface NewsItemDoc {
  id: string;
  category: NewsCategory;
  headlineEn: string;
  headlineMl: string;
  createdAt: number;
}

export interface VillageMetaDoc {
  nextResolutionAt: number;
  lastResolvedBuilding?: string;
  updatedByUid: string;
  updatedAt: number;
}

export interface BuildableCatalogItem {
  type: BuildingType;
  en: string;
  ml: string;
  keywords: string[];
  readyToastEn: string;
  readyToastMl: string;
}

export interface MilestoneRegion {
  id: string;
  threshold: number;
  x: number;
  y: number;
  en: string;
  ml: string;
  descEn: string;
  descMl: string;
}

export interface ShopItem {
  id: string;
  kind: 'addition' | 'roof';
  price: number;
  en: string;
  ml: string;
  additionId?: YardAddition;
  roofHex?: string;
}

export interface PlotShopCatalogItem {
  type: ShopType;
  price: number;
  en: string;
  ml: string;
  awningColor: string;
}

export const CHAYA_KADA_CENTER = { x: 1, y: 1 };

export const PLOT_SHOP_CATALOG: PlotShopCatalogItem[] = [
  { type: 'bakery', price: 40, en: 'Kerala Bakery', ml: 'ബേക്കറി', awningColor: '#e11d48' },
  { type: 'flower_shop', price: 40, en: 'Flower Shop', ml: 'പൂക്കട', awningColor: '#d97706' },
  { type: 'tailor', price: 45, en: 'Tailor Shop', ml: 'തയ്യൽക്കട', awningColor: '#2563eb' },
  { type: 'fish_stall', price: 45, en: 'Fish Stall', ml: 'മീൻ സ്റ്റാൾ', awningColor: '#0891b2' },
  { type: 'chaya_kada', price: 50, en: 'Mini Chaya Kada', ml: 'മിനി ചായക്കട', awningColor: '#b45309' },
];

export const ALL_YARD_ADDITIONS: YardAddition[] = [
  'coconutTree',
  'vegGarden',
  'cowShed',
  'swing',
  'rangoli',
  'pookalam',
  'nilavilakku',
  'tulsiThara',
  'bananaGrove',
  'rooster',
  'goat',
  'smallBoat',
];

export const FREE_YARD_ADDITIONS: YardAddition[] = ['coconutTree', 'cowShed', 'rangoli'];

export const DAILY_TASKS: {
  id: DailyTaskId;
  coins: number;
  en: string;
  ml: string;
  hintEn: string;
  hintMl: string;
}[] = [
  {
    id: 'waterTree',
    coins: 5,
    en: 'Water the coconut tree',
    ml: 'തെങ്ങിന് വെള്ളമൊഴിക്കൂ',
    hintEn: 'Leaves turn extra lush!',
    hintMl: 'ഓലകൾ കൂടുതൽ പച്ചപ്പാകും!',
  },
  {
    id: 'feedCow',
    coins: 5,
    en: 'Feed the cow',
    ml: 'പശുവിന് തീറ്റ കൊടുക്കൂ',
    hintEn: 'Happy moo & heart aura!',
    hintMl: 'സന്തോഷത്തോടെ നടക്കും!',
  },
  {
    id: 'sweepYard',
    coins: 5,
    en: 'Sweep the courtyard',
    ml: 'മുറ്റം അടിച്ചുവാരൂ',
    hintEn: 'Clean, sparkling muttam!',
    hintMl: 'വൃത്തിയുള്ള മുറ്റം!',
  },
  {
    id: 'lightLamp',
    coins: 5,
    en: 'Light the nilavilakku',
    ml: 'നിലവിളക്ക് കൊളുത്തൂ',
    hintEn: 'Warm golden evening glow!',
    hintMl: 'സുവർണ്ണ ദീപപ്രഭ!',
  },
];

export const STREAK_MILESTONES: { days: number; bonus: number }[] = [
  { days: 3, bonus: 15 },
  { days: 7, bonus: 35 },
  { days: 14, bonus: 75 },
  { days: 30, bonus: 150 },
];

export const DECORATE_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'add_nilavilakku',
    kind: 'addition',
    additionId: 'nilavilakku',
    price: 15,
    en: 'Brass Nilavilakku',
    ml: 'നിലവിളക്ക്',
  },
  {
    id: 'add_vegGarden',
    kind: 'addition',
    additionId: 'vegGarden',
    price: 15,
    en: 'Vegetable Garden',
    ml: 'പച്ചക്കറിത്തോട്ടം',
  },
  {
    id: 'add_pookalam',
    kind: 'addition',
    additionId: 'pookalam',
    price: 20,
    en: 'Onam Pookalam',
    ml: 'ഓണപ്പൂക്കളം',
  },
  {
    id: 'add_tulsiThara',
    kind: 'addition',
    additionId: 'tulsiThara',
    price: 20,
    en: 'Tulsi Thara',
    ml: 'തുളസിത്തറ',
  },
  {
    id: 'add_swing',
    kind: 'addition',
    additionId: 'swing',
    price: 25,
    en: 'Oonjal Swing',
    ml: 'ഊഞ്ഞാൽ',
  },
  {
    id: 'add_rooster',
    kind: 'addition',
    additionId: 'rooster',
    price: 25,
    en: 'Village Rooster',
    ml: 'നാടൻ കോഴി',
  },
  {
    id: 'add_bananaGrove',
    kind: 'addition',
    additionId: 'bananaGrove',
    price: 30,
    en: 'Banana Grove',
    ml: 'വാഴത്തോട്ടം',
  },
  {
    id: 'add_goat',
    kind: 'addition',
    additionId: 'goat',
    price: 35,
    en: 'Malabar Goat',
    ml: 'ആട്',
  },
  {
    id: 'add_smallBoat',
    kind: 'addition',
    additionId: 'smallBoat',
    price: 50,
    en: 'Canal Vallam Boat',
    ml: 'ചെറു വള്ളം',
  },
  {
    id: 'roof_temple_gold',
    kind: 'roof',
    roofHex: '#d49b27',
    price: 20,
    en: 'Kasavu Gold Roof',
    ml: 'കസവ് സ്വർണ്ണ മേൽക്കൂര',
  },
  {
    id: 'roof_royal_maroon',
    kind: 'roof',
    roofHex: '#7c2d36',
    price: 25,
    en: 'Tharavad Maroon Roof',
    ml: 'തറവാട് മെറൂൺ മേൽക്കൂര',
  },
  {
    id: 'roof_peacock_teal',
    kind: 'roof',
    roofHex: '#1e6f78',
    price: 30,
    en: 'Peacock Teal Roof',
    ml: 'മയിൽപ്പച്ച മേൽക്കൂര',
  },
];

export const VALLAM_TEAMS: {
  id: VallamTeam;
  en: string;
  ml: string;
  color: string;
  accent: string;
}[] = [
  { id: 'chundan_red', en: 'Chundan Red', ml: 'ചുണ്ടൻ ചുവപ്പ്', color: '#dc2626', accent: '#fef2f2' },
  { id: 'backwater_blue', en: 'Backwater Blue', ml: 'കായൽ നീല', color: '#2563eb', accent: '#eff6ff' },
  { id: 'paddy_green', en: 'Paddy Green', ml: 'നെൽപ്പച്ച', color: '#16a34a', accent: '#f0fdf4' },
  { id: 'coconut_gold', en: 'Coconut Gold', ml: 'കേര സ്വർണ്ണം', color: '#d97706', accent: '#fffbeb' },
];

export const CHAYA_QUICK_REPLIES: { en: string; ml: string }[] = [
  { en: 'Chaya kudikkaam?', ml: 'ചായ കുടിക്കാം?' },
  { en: 'Namaskaram', ml: 'നമസ്കാരം' },
  { en: 'Super veedu!', ml: 'സൂപ്പർ വീട്!' },
  { en: 'Onam aashamsakal', ml: 'ഓണാശംസകൾ' },
];

export const CHAYA_EMOTES: { id: EmoteType; icon: string; en: string; ml: string }[] = [
  { id: 'wave', icon: '👋', en: 'Wave', ml: 'കൈവീശൂ' },
  { id: 'laugh', icon: '😂', en: 'Laugh', ml: 'ചിരി' },
  { id: 'heart', icon: '❤️', en: 'Heart', ml: 'സ്നേഹം' },
  { id: 'cheers', icon: '🍵', en: 'Chaya', ml: 'ചായ' },
];

export const SKIN_TONES = [
  '#f5d5b8',
  '#e0b18c',
  '#c68b59',
  '#9c643b',
  '#6f4425',
];

export const OUTFIT_COLORS = [
  { id: 'kasavu', labelEn: 'Kasavu Cream', labelMl: 'കസവ്', hex: '#f8f2dc' },
  { id: 'emerald', labelEn: 'Paddy Green', labelMl: 'പച്ച', hex: '#2e7d5b' },
  { id: 'terracotta', labelEn: 'Laterite Red', labelMl: 'ചെങ്കൽ ചുവപ്പ്', hex: '#c85a3a' },
  { id: 'indigo', labelEn: 'Neelam Blue', labelMl: 'നീല', hex: '#355c7d' },
  { id: 'marigold', labelEn: 'Onam Gold', labelMl: 'സ്വർണ്ണ നിറം', hex: '#e09f3e' },
  { id: 'plum', labelEn: 'Hibiscus Plum', labelMl: 'ചെമ്പരത്തി', hex: '#8b3a62' },
];

export const ROOF_COLORS = [
  { id: 'clay', labelEn: 'Mangalore Clay', labelMl: 'ഓട് ചുവപ്പ്', hex: '#b85038' },
  { id: 'moss', labelEn: 'Monsoon Moss', labelMl: 'പായൽ പച്ച', hex: '#4f7a5a' },
  { id: 'slate', labelEn: 'Backwater Slate', labelMl: 'സ്ലേറ്റ് നീല', hex: '#4d657a' },
  { id: 'ochre', labelEn: 'Turmeric Ochre', labelMl: 'മഞ്ഞൾ നിറം', hex: '#c8873a' },
  { id: 'sand', labelEn: 'Thatch Sand', labelMl: 'ഓല നിറം', hex: '#a98e64' },
];

export const WALL_COLORS = [
  { id: 'lime', labelEn: 'Lime White', labelMl: 'ചുണ്ണാമ്പ് വെള്ള', hex: '#f6f2e9' },
  { id: 'sandstone', labelEn: 'Warm Cream', labelMl: 'ഇളം മഞ്ഞ', hex: '#efe3c8' },
  { id: 'sage', labelEn: 'Tender Leaf', labelMl: 'ഇളം പച്ച', hex: '#dce7d7' },
  { id: 'blush', labelEn: 'Laterite Blush', labelMl: 'ഇളം ചുവപ്പ്', hex: '#edd8cf' },
  { id: 'sky', labelEn: 'Coastal Mist', labelMl: 'ആകാശ നീല', hex: '#dce8ee' },
];

export const BUILDABLE_CATALOG: BuildableCatalogItem[] = [
  {
    type: 'chaya_kada',
    en: 'Toddy-free Chaya Kada',
    ml: 'ചായക്കട',
    keywords: ['chaya', 'tea shop', 'kada', 'chai', 'tea stall', 'toddy-free'],
    readyToastEn: 'Chaya Kada is ready! Fresh samovar tea is brewing.',
    readyToastMl: 'ചായക്കട തയ്യാറായി! ചൂടുചായ കുടിക്കാൻ വരൂ.',
  },
  {
    type: 'temple',
    en: 'Temple & Kulam',
    ml: 'ക്ഷേത്രവും കുളവും',
    keywords: ['temple', 'ambalam', 'kovil', 'kulam', 'pooram'],
    readyToastEn: 'Village Temple & Kulam is ready!',
    readyToastMl: 'ഗ്രാമക്ഷേത്രവും കുളവും തയ്യാറായി!',
  },
  {
    type: 'church',
    en: 'Village Church',
    ml: 'പള്ളി',
    keywords: ['church', 'palli', 'cathedral', 'chapel'],
    readyToastEn: 'Village Church is ready! Bells are ringing.',
    readyToastMl: 'ഗ്രാമത്തിലെ പള്ളി തയ്യാറായി!',
  },
  {
    type: 'mosque',
    en: 'Mosque',
    ml: 'മസ്ജിദ്',
    keywords: ['mosque', 'masjid', 'palli'],
    readyToastEn: 'Village Mosque is ready!',
    readyToastMl: 'മസ്ജിദ് തയ്യാറായി!',
  },
  {
    type: 'school',
    en: 'Village School',
    ml: 'പള്ളിക്കൂടം',
    keywords: ['school', 'pallikoodam', 'vidyalayam'],
    readyToastEn: 'Village School is ready!',
    readyToastMl: 'ഗ്രാമത്തിലെ സ്കൂൾ തയ്യാറായി!',
  },
  {
    type: 'panchayat_office',
    en: 'Panchayat Office',
    ml: 'പഞ്ചായത്ത് ഓഫീസ്',
    keywords: ['panchayat', 'office', 'civic'],
    readyToastEn: 'Panchayat Office is ready!',
    readyToastMl: 'പഞ്ചായത്ത് ഓഫീസ് തയ്യാറായി!',
  },
  {
    type: 'bus_stand',
    en: 'KSRTC Bus Stand',
    ml: 'ബസ് സ്റ്റാൻഡ്',
    keywords: ['bus stand', 'bus', 'ksrtc', 'stop'],
    readyToastEn: 'KSRTC Bus Stand is ready!',
    readyToastMl: 'ബസ് സ്റ്റാൻഡ് തയ്യാറായി!',
  },
  {
    type: 'railway_station',
    en: 'Railway Station',
    ml: 'റെയിൽവേ സ്റ്റേഷൻ',
    keywords: ['railway', 'train', 'station'],
    readyToastEn: 'Railway Station is ready!',
    readyToastMl: 'റെയിൽവേ സ്റ്റേഷൻ തയ്യാറായി!',
  },
  {
    type: 'ferry_jetty',
    en: 'Ferry Jetty',
    ml: 'ബോട്ട് ജെട്ടി',
    keywords: ['ferry', 'jetty', 'boat jetty', 'kadavu'],
    readyToastEn: 'Ferry Jetty is ready!',
    readyToastMl: 'ബോട്ട് ജെട്ടി തയ്യാറായി!',
  },
  {
    type: 'houseboat_dock',
    en: 'Houseboat Dock',
    ml: 'ഹൗസ്‌ബോട്ട് ഡോക്ക്',
    keywords: ['houseboat', 'kettuvallam', 'dock'],
    readyToastEn: 'Houseboat Dock is ready!',
    readyToastMl: 'ഹൗസ്‌ബോട്ട് ഡോക്ക് തയ്യാറായി!',
  },
  {
    type: 'market',
    en: 'Village Market',
    ml: 'ഗ്രാമച്ചന്ത',
    keywords: ['market', 'chantha', 'bazaar', 'shop'],
    readyToastEn: 'Village Market is ready!',
    readyToastMl: 'ഗ്രാമച്ചന്ത തയ്യാറായി!',
  },
  {
    type: 'hospital',
    en: 'Health Clinic',
    ml: 'ആശുപത്രി',
    keywords: ['hospital', 'clinic', 'health', 'ayurveda'],
    readyToastEn: 'Village Health Clinic is ready!',
    readyToastMl: 'ആശുപത്രി തയ്യാറായി!',
  },
  {
    type: 'library',
    en: 'Vayanasala Library',
    ml: 'വായനശാല',
    keywords: ['library', 'vayanasala', 'books', 'reading'],
    readyToastEn: 'Vayanasala Library is ready!',
    readyToastMl: 'വായനശാല തയ്യാറായി!',
  },
  {
    type: 'stadium',
    en: 'Village Stadium',
    ml: 'സ്റ്റേഡിയം',
    keywords: ['stadium', 'football', 'ground', 'sports', 'pooram ground'],
    readyToastEn: 'Village Stadium is ready!',
    readyToastMl: 'ഗ്രാമ സ്റ്റേഡിയം തയ്യാറായി!',
  },
  {
    type: 'beach',
    en: 'Coconut Beach',
    ml: 'കടൽത്തീരം',
    keywords: ['beach', 'kovalam', 'varkala', 'sea', 'coast'],
    readyToastEn: 'Coconut Beach promenade is ready!',
    readyToastMl: 'കടൽത്തീരം തയ്യാറായി!',
  },
  {
    type: 'lighthouse',
    en: 'Coastal Lighthouse',
    ml: 'വിളക്കുമാടം',
    keywords: ['lighthouse', 'beacon'],
    readyToastEn: 'Coastal Lighthouse is ready!',
    readyToastMl: 'വിളക്കുമാടം തയ്യാറായി!',
  },
  {
    type: 'tea_estate',
    en: 'Tea Estate',
    ml: 'തേയിലത്തോട്ടം',
    keywords: ['tea estate', 'tea hill', 'munnar', 'plantation'],
    readyToastEn: 'Misty Tea Estate is ready!',
    readyToastMl: 'തേയിലത്തോട്ടം തയ്യാറായി!',
  },
  {
    type: 'waterfall',
    en: 'Athirappilly Waterfall',
    ml: 'വെള്ളച്ചാട്ടം',
    keywords: ['waterfall', 'falls', 'athirappilly'],
    readyToastEn: 'Waterfall Sanctuary is ready!',
    readyToastMl: 'വെള്ളച്ചാട്ടം തയ്യാറായി!',
  },
  {
    type: 'cinema_theatre',
    en: 'Cinema Talkies',
    ml: 'സിനിമാ കൊട്ടക',
    keywords: ['cinema', 'theatre', 'theater', 'talkies', 'movie'],
    readyToastEn: 'Village Cinema Talkies is ready!',
    readyToastMl: 'സിനിമാ കൊട്ടക തയ്യാറായി!',
  },
  {
    type: 'kalari',
    en: 'Kalari Payattu Arena',
    ml: 'കളരി',
    keywords: ['kalari', 'kalaripayattu', 'martial'],
    readyToastEn: 'Kalari Arena is ready!',
    readyToastMl: 'കളരി തയ്യാറായി!',
  },
  {
    type: 'boat_race_canal',
    en: 'Vallam Kali Canal',
    ml: 'വള്ളംകളി കനാൽ',
    keywords: ['boat race', 'vallam kali', 'snake boat', 'chundan', 'canal'],
    readyToastEn: 'Vallam Kali Boat Race Canal is ready!',
    readyToastMl: 'വള്ളംകളി കനാൽ തയ്യാറായി!',
  },
  {
    type: 'mall',
    en: 'Village Centre Mall',
    ml: 'ഷോപ്പിംഗ് മാൾ',
    keywords: ['mall', 'shopping', 'escalator', 'food court', 'plaza'],
    readyToastEn: 'Ente Veedu Shopping Mall is open!',
    readyToastMl: 'ഷോപ്പിംഗ് മാൾ തുറന്നു!',
  },
  {
    type: 'police_station',
    en: 'Police Station',
    ml: 'പോലീസ് സ്റ്റേഷൻ',
    keywords: ['police', 'station', 'safety', 'janamaithri'],
    readyToastEn: 'Janamaithri Police Station is ready!',
    readyToastMl: 'പോലീസ് സ്റ്റേഷൻ തയ്യാറായി!',
  },
  {
    type: 'post_office',
    en: 'Post Office',
    ml: 'തപാൽ ഓഫീസ്',
    keywords: ['post office', 'post', 'mail', 'postcard', 'postal'],
    readyToastEn: 'Kerala Post Office is open for postcards!',
    readyToastMl: 'തപാൽ ഓഫീസ് തുറന്നു!',
  },
  {
    type: 'bank',
    en: 'Co-op Bank',
    ml: 'സഹകരണ ബാങ്ക്',
    keywords: ['bank', 'coop', 'vault', 'savings'],
    readyToastEn: 'Village Co-op Bank is ready!',
    readyToastMl: 'സഹകരണ ബാങ്ക് തയ്യാറായി!',
  },
  {
    type: 'bakery',
    en: 'Kerala Bakery',
    ml: 'ബേക്കറി',
    keywords: ['bakery', 'chips', 'halwa', 'puffs', 'cake'],
    readyToastEn: 'Hot Kerala Bakery is open!',
    readyToastMl: 'ബേക്കറി തുറന്നു!',
  },
  {
    type: 'petrol_pump',
    en: 'Petrol Bunk',
    ml: 'പെട്രോൾ പമ്പ്',
    keywords: ['petrol', 'pump', 'fuel', 'diesel', 'bunk'],
    readyToastEn: 'Highway Petrol Bunk is ready!',
    readyToastMl: 'പെട്രോൾ പമ്പ് തയ്യാറായി!',
  },
  {
    type: 'fish_stall',
    en: 'Fresh Fish Stall',
    ml: 'മീൻ സ്റ്റാൾ',
    keywords: ['fish', 'karimeen', 'meen', 'seafood'],
    readyToastEn: 'Fresh Karimeen Fish Stall is open!',
    readyToastMl: 'മീൻ സ്റ്റാൾ തുറന്നു!',
  },
  {
    type: 'park',
    en: 'Municipal Park',
    ml: 'പാർക്ക്',
    keywords: ['park', 'garden', 'fountain', 'bench'],
    readyToastEn: 'Green Municipal Park is open!',
    readyToastMl: 'മുനിസിപ്പൽ പാർക്ക് തുറന്നു!',
  },
];

export const MILESTONE_REGIONS: MilestoneRegion[] = [
  {
    id: 'market',
    threshold: 10,
    x: 4,
    y: -3,
    en: 'Chanthakkavala Market',
    ml: 'ചന്തക്കവല',
    descEn: 'Spices, plantains & morning fish stalls',
    descMl: 'സുഗന്ധവ്യഞ്ജനങ്ങളും പച്ചക്കറികളും നിറഞ്ഞ ചന്ത',
  },
  {
    id: 'alappuzha',
    threshold: 50,
    x: -7,
    y: 4,
    en: 'Alappuzha Backwaters',
    ml: 'ആലപ്പുഴ കായൽ',
    descEn: 'Kettuvallam houseboats & coconut lagoons',
    descMl: 'കെട്ടുവള്ളങ്ങളും കായൽത്തീരവും',
  },
  {
    id: 'munnar',
    threshold: 100,
    x: -9,
    y: -8,
    en: 'Munnar Tea Hills',
    ml: 'മൂന്നാർ തേയിലമലകൾ',
    descEn: 'Misty terraced slopes & Neelakurinji blooms',
    descMl: 'മഞ്ഞണിഞ്ഞ തേയിലത്തോട്ടങ്ങൾ',
  },
  {
    id: 'fort_kochi',
    threshold: 250,
    x: 9,
    y: 5,
    en: 'Fort Kochi Fishing Nets',
    ml: 'ഫോർട്ട് കൊച്ചി ചീനവലകൾ',
    descEn: 'Iconic cantilevered Cheena Vala at sunset',
    descMl: 'സായാഹ്നത്തിലെ ഫോർട്ട് കൊച്ചി ചീനവലകൾ',
  },
  {
    id: 'thrissur',
    threshold: 500,
    x: 8,
    y: -9,
    en: 'Thrissur Pooram Ground',
    ml: 'തൃശ്ശൂർ പൂരം മൈതാനം',
    descEn: 'Festive parasols, chenda melam & illuminations',
    descMl: 'കുടമാറ്റവും മേളവും നിറഞ്ഞ പൂരപ്പറമ്പ്',
  },
  {
    id: 'kovalam',
    threshold: 1000,
    x: 11,
    y: 11,
    en: 'Kovalam & Varkala Cliff',
    ml: 'കോവളം & വർക്കല തീരം',
    descEn: 'Red laterite sea cliff & striped lighthouse',
    descMl: 'ചെങ്കൽ കുന്നുകളും വിളക്കുമാടവും കടൽത്തീരവും',
  },
];

export function matchBuildingType(text: string): BuildableCatalogItem | null {
  const normalized = text.toLowerCase().trim();
  for (const item of BUILDABLE_CATALOG) {
    if (item.keywords.some((kw) => normalized.includes(kw))) {
      return item;
    }
  }
  return null;
}
