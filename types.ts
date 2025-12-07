
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  WORKSPACE_ADMIN = 'WORKSPACE_ADMIN', // School Principal / Manager
  TEACHER = 'TEACHER', // ADMIN in the context of a Room
  STUDENT = 'STUDENT',
  OBSERVER = 'OBSERVER'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string; // URL to image
  workspaceId?: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string; // Used for login identification
  subject: string;
  password?: string;
  avatar?: string;
}

export interface Student {
  id: string;
  name: string;
  username: string; // Used for login
  gradeLevel: string;
  parentPhone?: string;
  avatar?: string;
}

export type ActivityType = 'IDLE' | 'WATCHING_VIDEO' | 'SOLVING_EXERCISE' | 'SUBMITTING_ASSIGNMENT' | 'TAKING_QUIZ';

export interface Participant extends User {
  isMuted: boolean;
  isVideoOff: boolean;
  isHandRaised: boolean;
  isScreenSharing: boolean;
  isSpeaking?: boolean; // New: visualizer state
  stars: number; // New: Reward system
  stream?: MediaStream;
  currentActivity?: ActivityType; // What the student is currently doing
  activityProgress?: number; // 0-100%
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface Reaction {
  id: string;
  emoji: string;
  senderId: string;
  leftOffset: number;
}

export interface LessonResource {
  id: string;
  name: string;
  type: 'PDF' | 'VIDEO' | 'LINK' | 'IMAGE';
  url: string;
}

export interface LessonStage {
  id: string;
  title: string;
  description?: string;
  type: ActivityType;
  durationMin: number;
  isActive: boolean;
  isCompleted: boolean;
  resources?: LessonResource[]; // Files attached to this stage
}

export interface ClassSession {
  id: string;
  name: string;
  teacherName: string;
  startTime: string;
  isActive: boolean;
}

export interface CreateClassRequest {
  className: string;
  teacherName: string;
  students: string[];
}

export interface ClassResponse {
  classId: string;
  adminLink: string;
  studentLinks: { name: string; link: string }[];
  commonLink: string;
}

// New Types for Board Interaction
export interface BoardComment {
  id: string;
  x: number;
  y: number;
  text: string;
  authorName: string;
  isResolved: boolean;
}

export interface PresentationState {
  isActive: boolean;
  fileUrl: string | null;
  fileName: string | null;
  type: 'IMAGE' | 'PDF' | 'VIDEO' | 'NONE';
}

// --- NEW TYPES FOR EVENTS & PLANNING ---

export type AppEventType = 'INFO' | 'WARNING' | 'SUCCESS' | 'CHAT' | 'HAND' | 'SPEAKING';

export interface AppEvent {
  id: string;
  type: AppEventType;
  message: string;
  timestamp: number;
  userId?: string;
  userAvatar?: string;
  userName?: string;
}

export interface ToolbarConfig {
  whiteboard: boolean;
  screenShare: boolean;
  files: boolean;
  chat: boolean;
  grid: boolean;
}

export interface ScheduledClass {
  id: string; // Creates a room ID
  title: string;
  date: string; // ISO String or specific format
  time: string;
  studentCount: number;
  status: 'UPCOMING' | 'COMPLETED' | 'LIVE';
  teacherId?: string;
}

// --- NEW TYPES FOR ADMIN & WORKSPACE ---

export interface WeeklySchedule {
  dayOfWeek: number; // 0 = Sunday (Shanbeh in our context logic), 1 = Monday...
  startTime: string; // "14:00"
  endTime: string;   // "15:30"
}

export interface ClassLicense {
  id: string;
  title: string; // e.g. "License for Math Class"
  capacity: 30 | 100;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  renewPeriod: 'DAILY' | 'WEEKLY';
  costPerPeriod: number;
  isActive: boolean;
  
  // Assignment Logic
  teacherId?: string;
  studentIds?: string[];
  schedule?: WeeklySchedule[];
}

export interface Workspace {
  id: string;
  name: string; // School Name
  managerName: string;
  walletBalance: number;
  activeLicenses?: ClassLicense[];
  teacherCount: number;
  studentCount: number;
  status: 'ACTIVE' | 'SUSPENDED';
  activePlan?: 'HOURLY' | 'MONTHLY' | 'YEARLY' | 'NONE';
  planExpiryDate?: string;
}

export interface SystemLog {
  id: string;
  action: string;
  admin: string;
  timestamp: string;
  details: string;
}