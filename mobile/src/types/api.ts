export type UserRole = 'USER' | 'ADMIN';

export type User = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type AuthTokens = {
  accessToken: string;
};

export type AuthResponse = {
  user: User;
  tokens?: AuthTokens;
};

export type MeResponse = {
  user: User;
};

export type PregnancyProfile = {
  id: string;
  lastMenstrualPeriod: string | null;
  dueDate: string;
  pregnancyWeek: number | null;
  pregnancyDay: number | null;
  trimester: number | null;
  createdAt: string;
  updatedAt: string;
};

export type PregnancyProfileResponse = {
  profile: PregnancyProfile | null;
};

export type PregnancyProfilePayload =
  | {
      lastMenstrualPeriod: string;
      dueDate?: never;
      currentPregnancyWeek?: never;
      currentPregnancyDay?: never;
    }
  | {
      dueDate: string;
      lastMenstrualPeriod?: never;
      currentPregnancyWeek?: never;
      currentPregnancyDay?: never;
    }
  | {
      currentPregnancyWeek: number;
      currentPregnancyDay?: number;
      lastMenstrualPeriod?: never;
      dueDate?: never;
    };

export type DiaryMood =
  | 'JOYFUL'
  | 'CALM'
  | 'NEUTRAL'
  | 'SAD'
  | 'ANXIOUS'
  | 'IRRITATED'
  | 'OVERWHELMED'
  | 'HOPEFUL'
  | 'GRATEFUL'
  | 'RELAXED'
  | 'EXCITED'
  | 'CONFIDENT'
  | 'SENSITIVE'
  | 'LONELY';

export type DiarySymptomType =
  | 'NAUSEA'
  | 'VOMITING'
  | 'FATIGUE'
  | 'HEADACHE'
  | 'DIZZINESS'
  | 'HEARTBURN'
  | 'BACK_PAIN'
  | 'ABDOMINAL_DISCOMFORT'
  | 'SHORTNESS_OF_BREATH'
  | 'SWELLING'
  | 'FREQUENT_URINATION'
  | 'SLEEP_PROBLEMS'
  | 'CONSTIPATION'
  | 'LEG_CRAMPS'
  | 'OTHER';

export type SymptomSeverity = 'MILD' | 'MODERATE' | 'SEVERE';

export type DiarySymptomItem = {
  type: DiarySymptomType;
  severity: SymptomSeverity;
};

export type SleepQuality = 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';

export type MedicationStatus = 'ON_TIME' | 'LATE' | 'MISSED' | 'NOT_APPLICABLE';

export type DiaryEntry = {
  id: string;
  date: string;
  wellbeingRating: number;
  moods: DiaryMood[];
  mood: DiaryMood | null;
  energyLevel: number;
  sleepHours: number;
  sleepQuality: SleepQuality;
  symptoms: DiarySymptomItem[];
  note: string | null;
  waterMl: number | null;
  medicationStatus: MedicationStatus | null;
  weightKg: number | null;
  basalTemperatureC: number | null;
  createdAt: string;
  updatedAt: string;
};

export type DiaryEntriesResponse = {
  entries: DiaryEntry[];
};

export type DiaryEntryResponse = {
  entry: DiaryEntry;
};

export type CreateDiaryEntryRequest = {
  date: string;
  wellbeingRating: number;
  moods: DiaryMood[];
  energyLevel: number;
  sleepHours: number;
  sleepQuality: SleepQuality;
  symptoms?: DiarySymptomItem[] | null;
  waterMl?: number | null;
  medicationStatus?: MedicationStatus | null;
  weightKg?: number | null;
  basalTemperatureC?: number | null;
  note?: string | null;
};

export type UpdateDiaryEntryRequest = Partial<CreateDiaryEntryRequest>;

export type VisitStatus = 'PLANNED' | 'COMPLETED' | 'CANCELLED';

export type Visit = {
  id: string;
  title: string;
  specialist: string | null;
  date: string;
  time: string | null;
  location: string | null;
  notes: string | null;
  preparationNotes: string | null;
  status: VisitStatus;
  createdAt: string;
  updatedAt: string;
};

export type VisitsResponse = {
  visits: Visit[];
};

export type VisitResponse = {
  visit: Visit;
};

export type CreateVisitRequest = {
  title: string;
  specialist?: string;
  date: string;
  time?: string;
  location?: string;
  notes?: string;
  preparationNotes?: string;
  status: VisitStatus;
};

export type UpdateVisitRequest = Partial<{
  title: string;
  specialist: string | null;
  date: string;
  time: string | null;
  location: string | null;
  notes: string | null;
  preparationNotes: string | null;
  status: VisitStatus;
}>;

export type DoctorQuestionStatus = 'NEW' | 'ANSWERED' | 'ARCHIVED';

export type DoctorQuestion = {
  id: string;
  question: string;
  answer: string | null;
  status: DoctorQuestionStatus;
  visitId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DoctorQuestionsResponse = {
  questions: DoctorQuestion[];
};

export type DoctorQuestionResponse = {
  question: DoctorQuestion;
};

export type CreateDoctorQuestionRequest = {
  question: string;
  answer?: string;
  status: DoctorQuestionStatus;
  visitId?: string;
};

export type UpdateDoctorQuestionRequest = Partial<{
  question: string;
  answer: string | null;
  status: DoctorQuestionStatus;
  visitId: string | null;
}>;

export type PregnancyWeekSummary = {
  week: number;
  trimester: number;
  title: string;
  babySize: string | null;
  babyWeight: string | null;
  fruitComparison: string | null;
};

export type PregnancyWeekContent = {
  id: string;
  week: number;
  trimester: number;
  title: string;
  babySize: string | null;
  babyWeight: string | null;
  babyLength: string | null;
  fruitComparison: string | null;
  babyDevelopment: string;
  motherChanges: string;
  recommendation: string;
  symptoms: string | null;
  warnings: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PregnancyWeekContentResponse = {
  content: PregnancyWeekContent;
};

export type PregnancyWeeksResponse = {
  weeks: PregnancyWeekSummary[];
};

export type DailyTipResponse = {
  date: string;
  pregnancyWeek: number | null;
  title: string;
  text: string;
  isGeneral: boolean;
};

export type ChecklistCategory =
  | 'DOCUMENTS'
  | 'HEALTH'
  | 'DOCTOR'
  | 'HOSPITAL_BAG'
  | 'BABY'
  | 'OTHER';

export type ChecklistItem = {
  id: string;
  week: number;
  title: string;
  description: string | null;
  category: ChecklistCategory;
  sortOrder: number;
  isDefault: boolean;
  isOwnedByUser: boolean;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChecklistItemWriteRequest = {
  week: number;
  title: string;
  description?: string | null;
  category: ChecklistCategory;
};

export type ChecklistItemsResponse = {
  items: ChecklistItem[];
};

export type ChecklistItemResponse = {
  item: ChecklistItem;
};

export type ArticleCategory =
  | 'PREGNANCY'
  | 'NUTRITION'
  | 'ACTIVITY'
  | 'CHECKLISTS'
  | 'DOCTOR';

export type ArticleListItem = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  category: ArticleCategory;
  pregnancyWeek: number | null;
  readingTimeMinutes: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Article = ArticleListItem & {
  content: string;
};

export type ArticlesResponse = {
  articles: ArticleListItem[];
};

export type ArticleResponse = {
  article: Article;
};
