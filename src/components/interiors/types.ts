import {
  BuildingDoc,
  CinemaChatDoc,
  CinemaSeatDoc,
  Language,
  PlayerDoc,
  PostcardDoc,
  PostcardStamp,
} from '../../types/village';
import {
  MallAccessoryOption,
  MallFurnitureOption,
  MallOutfitOption,
  TownBuildingConfig,
} from '../../utils/townBuildings';

export interface BuildingInteriorProps {
  building: BuildingDoc;
  config: TownBuildingConfig | null;
  lang: Language;
  isDemoMode: boolean;
  myPlayer: PlayerDoc | null;
  players: PlayerDoc[];
  receivedPostcards: PostcardDoc[];
  sentPostcards: PostcardDoc[];
  cinemaSeats: CinemaSeatDoc[];
  cinemaChat: CinemaChatDoc[];
  onRequireJoin: () => void;
  onExit: () => void;
  onFlyToLocation: (x: number, y: number, zoom?: number) => void;
  onShowToast: (msg: string) => void;
  onBuyMallOutfit: (outfit: MallOutfitOption) => Promise<void>;
  onBuyMallAccessory: (acc: MallAccessoryOption) => Promise<void>;
  onBuyMallFurniture: (furn: MallFurnitureOption) => Promise<void>;
  onSpendHealthBoost: (
    price: number,
    healAmount: number,
    toastEn: string,
    toastMl: string
  ) => Promise<void>;
  onClaimSchoolQuiz: () => Promise<number>;
  onHospitalHeal: (usePaidTonic: boolean) => Promise<void>;
  onApplyActivityHealth: (deltaHealth: number, injuryReason?: string) => Promise<void>;
  onBankDeposit: (amount: number) => Promise<void>;
  onBankWithdraw: (amount: number) => Promise<void>;
  onBankClaimInterest: () => Promise<number>;
  onSendPostcard: (params: {
    recipientUid: string;
    recipientUsername: string;
    stamp: PostcardStamp;
    message: string;
  }) => Promise<void>;
  onMarkPostcardRead: (id: string) => Promise<void>;
  onSitCinemaSeat: (row: number, col: number) => Promise<void>;
  onLeaveCinemaSeat: () => Promise<void>;
  onSendCinemaChat: (text: string) => Promise<void>;
  onRefuelBus?: () => void;
}
