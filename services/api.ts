
import { ClassResponse, CreateClassRequest, UserRole, Workspace, ClassLicense, Teacher, User } from '../types';

// Helper to generate random IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- MOCK DATABASE (LOCAL STORAGE) ---
const DB_KEYS = {
  SYSTEM_CONFIG: 'classconnect_system_config', // NEW: Tracks installation status
  WORKSPACE: 'classconnect_workspace',
  LICENSES: 'classconnect_licenses',
  USERS: 'classconnect_users',
  TEACHERS: 'classconnect_teachers' 
};

// Ensure default data exists if keys are missing (Fallback for dev/debug)
const ensureDB = () => {
  if (!localStorage.getItem(DB_KEYS.WORKSPACE)) {
    const defaultWorkspace: Workspace = {
      id: 'w1',
      name: 'مدرسه پیش‌فرض',
      managerName: 'مدیر سیستم',
      walletBalance: 0, 
      teacherCount: 0,
      studentCount: 0,
      status: 'ACTIVE',
      activePlan: 'NONE'
    };
    localStorage.setItem(DB_KEYS.WORKSPACE, JSON.stringify(defaultWorkspace));
  }
  if (!localStorage.getItem(DB_KEYS.LICENSES)) {
    localStorage.setItem(DB_KEYS.LICENSES, JSON.stringify([]));
  }
  if (!localStorage.getItem(DB_KEYS.TEACHERS)) {
    localStorage.setItem(DB_KEYS.TEACHERS, JSON.stringify([]));
  }
};

// --- HELPER FOR PERSIAN DATES ---
export const toPersianDate = (dateStr: string) => {
    try {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
    } catch (e) {
        return dateStr;
    }
};

export const ApiService = {
  
  // --- SYSTEM / INSTALLATION METHODS ---
  isInstalled: (): boolean => {
      // For dev purposes, if DB_KEYS.WORKSPACE exists, we consider it installed
      return !!localStorage.getItem(DB_KEYS.SYSTEM_CONFIG) || !!localStorage.getItem(DB_KEYS.WORKSPACE);
  },

  installSystem: async (config: any): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate installation delay
      
      const systemConfig = {
          installedAt: new Date().toISOString(),
          dbType: config.dbType,
          adminEmail: config.adminEmail,
          version: '1.0.0'
      };
      
      localStorage.setItem(DB_KEYS.SYSTEM_CONFIG, JSON.stringify(systemConfig));
      
      // Initialize Default Data after install
      const defaultWorkspace: Workspace = {
        id: 'w1',
        name: 'فضای کاری اصلی',
        managerName: config.adminName,
        walletBalance: 0, 
        teacherCount: 0,
        studentCount: 0,
        status: 'ACTIVE',
        activePlan: 'NONE'
      };
      localStorage.setItem(DB_KEYS.WORKSPACE, JSON.stringify(defaultWorkspace));
      localStorage.setItem(DB_KEYS.LICENSES, JSON.stringify([]));
      localStorage.setItem(DB_KEYS.TEACHERS, JSON.stringify([]));
  },

  // --- CLASSROOM METHODS ---
  createClass: async (data: CreateClassRequest): Promise<ClassResponse> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const classId = generateId();
    const currentHref = window.location.href;
    const hashIndex = currentHref.indexOf('#');
    const baseUrlBase = hashIndex !== -1 ? currentHref.substring(0, hashIndex) : currentHref;
    const baseUrl = `${baseUrlBase}#/room/${classId}`;

    const studentLinks = data.students.map(studentName => ({
      name: studentName,
      link: `${baseUrl}?role=${UserRole.STUDENT}&name=${encodeURIComponent(studentName)}&id=${generateId()}`
    }));

    return {
      classId,
      adminLink: `${baseUrl}?role=${UserRole.TEACHER}&name=${encodeURIComponent(data.teacherName)}&id=${generateId()}`,
      studentLinks,
      commonLink: `${baseUrl}?role=${UserRole.STUDENT}`
    };
  },

  // --- WORKSPACE & LICENSE METHODS ---

  getWorkspace: async (): Promise<Workspace> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    ensureDB();
    const data = localStorage.getItem(DB_KEYS.WORKSPACE);
    return data ? JSON.parse(data) : null;
  },

  updateWalletBalance: async (newBalance: number): Promise<Workspace> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    ensureDB();
    const ws = JSON.parse(localStorage.getItem(DB_KEYS.WORKSPACE) || '{}');
    ws.walletBalance = newBalance;
    localStorage.setItem(DB_KEYS.WORKSPACE, JSON.stringify(ws));
    return ws;
  },

  getLicenses: async (): Promise<ClassLicense[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    ensureDB();
    const data = localStorage.getItem(DB_KEYS.LICENSES);
    return data ? JSON.parse(data) : [];
  },

  createLicense: async (license: ClassLicense): Promise<ClassLicense> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    ensureDB();
    const licenses: ClassLicense[] = JSON.parse(localStorage.getItem(DB_KEYS.LICENSES) || '[]');
    licenses.push(license);
    localStorage.setItem(DB_KEYS.LICENSES, JSON.stringify(licenses));
    return license;
  },

  updateLicense: async (updatedLicense: ClassLicense): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    ensureDB();
    const licenses: ClassLicense[] = JSON.parse(localStorage.getItem(DB_KEYS.LICENSES) || '[]');
    const index = licenses.findIndex(l => l.id === updatedLicense.id);
    if (index !== -1) {
      licenses[index] = updatedLicense;
      localStorage.setItem(DB_KEYS.LICENSES, JSON.stringify(licenses));
    }
  },

  deleteLicense: async (id: string): Promise<void> => {
     await new Promise(resolve => setTimeout(resolve, 300));
     ensureDB();
     let licenses: ClassLicense[] = JSON.parse(localStorage.getItem(DB_KEYS.LICENSES) || '[]');
     licenses = licenses.filter(l => l.id !== id);
     localStorage.setItem(DB_KEYS.LICENSES, JSON.stringify(licenses));
  },

  // --- TEACHER METHODS ---

  getTeachers: async (): Promise<Teacher[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    ensureDB();
    const data = localStorage.getItem(DB_KEYS.TEACHERS);
    return data ? JSON.parse(data) : [];
  },

  createTeacher: async (teacher: Teacher): Promise<Teacher> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    ensureDB();
    const teachers: Teacher[] = JSON.parse(localStorage.getItem(DB_KEYS.TEACHERS) || '[]');
    teachers.push(teacher);
    localStorage.setItem(DB_KEYS.TEACHERS, JSON.stringify(teachers));
    return teacher;
  },

  deleteTeacher: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    ensureDB();
    let teachers: Teacher[] = JSON.parse(localStorage.getItem(DB_KEYS.TEACHERS) || '[]');
    teachers = teachers.filter(t => t.id !== id);
    localStorage.setItem(DB_KEYS.TEACHERS, JSON.stringify(teachers));
  },
  
  getUsers: async (): Promise<User[]> => {
    return [];
  }
};
