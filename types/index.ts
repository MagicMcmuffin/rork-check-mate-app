export type UserRole = 'company' | 'administrator' | 'management' | 'mechanic' | 'apprentice' | 'employee';

export type DayOfWeek = 'M' | 'T' | 'W' | 'Th' | 'F' | 'S' | 'Su';

export type CheckStatus = 'A' | 'B' | 'C' | 'N/A' | '✓' | '✗' | null;

export interface Project {
  id: string;
  name: string;
  projectNumber: string;
  emails: string[];
  createdAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  make: string;
  model: string;
  serialNumber: string;
  type: 'plant' | 'vehicles' | 'lifting' | 'electrical' | 'cat-genny' | 'other';
  hitchType?: string;
  hitchSerial?: string;
  registration?: string;
  thoroughExaminationDate?: string;
  thoroughExaminationCertificate?: string;
  nextServiceDate?: string;
  purchaseDate?: string;
  notes?: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  email: string;
  logo?: string;
  projects: Project[];
  equipment: Equipment[];
  createdAt: string;
}

export interface User {
  id: string;
  role: UserRole;
  companyId?: string;
  companyIds?: string[];
  currentCompanyId?: string;
  name: string;
  email: string;
  password: string;
  profilePicture?: string;
  createdAt: string;
}

export interface PlantInspectionItem {
  id: string;
  name: string;
  icon: string;
}

export interface PlantInspectionCheck {
  itemId: string;
  day: DayOfWeek;
  status: CheckStatus;
  notes?: string;
  pictures?: string[];
}

export interface PlantInspection {
  id: string;
  companyId: string;
  projectId?: string;
  employeeId: string;
  employeeName: string;
  plantNumber: string;
  equipmentId?: string;
  carriedOutBy: string;
  date: string;
  checks: PlantInspectionCheck[];
  notesOnDefects: string;
  isFixed?: boolean;
  fixedBy?: string;
  fixedAt?: string;
  createdAt: string;
}

export interface QuickHitchItem {
  id: string;
  category: string;
  name: string;
  requiresDaily?: boolean;
}

export interface QuickHitchCheck {
  itemId: string;
  day: DayOfWeek;
  status: CheckStatus | boolean;
}

export interface QuickHitchInspection {
  id: string;
  companyId: string;
  projectId?: string;
  employeeId: string;
  operatorName: string;
  quickHitchModel: string;
  equipmentId?: string;
  excavatorDetails: string;
  date: string;
  checks: QuickHitchCheck[];
  remarks: string;
  operatorSignature?: string;
  managerSignature?: string;
  isFixed?: boolean;
  fixedBy?: string;
  fixedAt?: string;
  createdAt: string;
}

export interface VehicleInspectionItem {
  id: string;
  name: string;
  category?: string;
}

export interface VehicleInspectionCheck {
  itemId: string;
  status: CheckStatus;
  notes?: string;
  pictures?: string[];
}

export interface VehicleInspection {
  id: string;
  companyId: string;
  projectId?: string;
  employeeId: string;
  employeeName: string;
  vehicleRegistration: string;
  equipmentId?: string;
  vehicleType: string;
  mileage: string;
  date: string;
  checks: VehicleInspectionCheck[];
  additionalComments: string;
  isFixed?: boolean;
  fixedBy?: string;
  fixedAt?: string;
  createdAt: string;
}

export interface BucketChangeCheck {
  itemId: string;
  status: CheckStatus | boolean;
  notes?: string;
}

export interface BucketChangeInspection {
  id: string;
  companyId: string;
  projectId?: string;
  employeeId: string;
  employeeName: string;
  equipmentId?: string;
  bucketType: string;
  date: string;
  checks: BucketChangeCheck[];
  operatorSignature?: string;
  witnessName?: string;
  witnessSignature?: string;
  isFixed?: boolean;
  fixedBy?: string;
  fixedAt?: string;
  createdAt: string;
}

export type InspectionType = 'plant' | 'quickhitch' | 'vehicle' | 'bucket';

export interface Notification {
  id: string;
  companyId: string;
  inspectionId: string;
  inspectionType: InspectionType;
  equipmentName: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  reportedBy: string;
  reportedAt: string;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: string;
  createdAt: string;
}

export interface PositiveIntervention {
  id: string;
  companyId: string;
  projectId?: string;
  employeeId: string;
  employeeName: string;
  date: string;
  hazardDescription: string;
  severity: 'low' | 'medium' | 'high';
  actionTaken: string;
  site?: string;
  location?: string;
  pictures?: string[];
  createdAt: string;
}

export interface FixLog {
  id: string;
  inspectionId: string;
  inspectionType: InspectionType;
  fixedBy: string;
  fixedAt: string;
  notes?: string;
}

export interface ApprenticeshipEntry {
  id: string;
  companyId: string;
  apprenticeId: string;
  apprenticeName: string;
  date: string;
  learningDescription: string;
  pictures?: string[];
  createdAt: string;
}

export interface Announcement {
  id: string;
  companyId: string;
  authorId: string;
  authorName: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  createdAt: string;
}

export type DraftType = 'plant' | 'quickhitch' | 'vehicle' | 'bucketchange' | 'intervention' | 'greasing';

export interface DayData {
  day: DayOfWeek;
  date: string;
  completed: boolean;
  checks: any[];
  additionalData?: any;
}

export interface WeeklyDraftData {
  equipmentId?: string;
  plantNumber?: string;
  vehicleRegistration?: string;
  vehicleType?: string;
  excavatorDetails?: string;
  quickHitchModel?: string;
  bucketType?: string;
  projectId?: string;
  days: DayData[];
  weekStartDate: string;
}

export interface Draft {
  id: string;
  type: DraftType;
  companyId: string;
  employeeId: string;
  employeeName: string;
  data: Partial<PlantInspection | QuickHitchInspection | VehicleInspection | BucketChangeInspection | PositiveIntervention | GreasingInspection> | WeeklyDraftData;
  isWeeklyReport?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GreasingRecord {
  id: string;
  companyId: string;
  equipmentId: string;
  equipmentName: string;
  employeeId: string;
  employeeName: string;
  date: string;
  time: string;
  notes?: string;
  nextDueDate?: string;
  createdAt: string;
}

export interface GreasingInspectionCheck {
  itemId: string;
  status: CheckStatus;
  notes?: string;
}

export interface GreasingInspection {
  id: string;
  companyId: string;
  projectId?: string;
  employeeId: string;
  employeeName: string;
  equipmentId?: string;
  equipmentName: string;
  equipmentType: 'plant' | 'vehicles';
  date: string;
  checks: GreasingInspectionCheck[];
  greasingDuration: string;
  additionalNotes: string;
  createdAt: string;
}
