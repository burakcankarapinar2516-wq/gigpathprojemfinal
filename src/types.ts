export type Platform = 'Upwork' | 'Fiverr' | 'Bionluk' | 'Direct' | 'Other';
export type ProjectStatus = 'Draft' | 'Active' | 'Completed' | 'Invoiced' | 'Paid';

export interface EmailTemplates {
  invoicePaidTitle?: string;
  invoicePaidBody?: string;
  deadlineTitle?: string;
  deadlineBody?: string;
}

export interface Profile {
  name: string;
  title: string;
  email: string;
  address: string;
  hourlyRate: number;
  taxRate?: number;
  theme?: 'light' | 'dark' | 'system';
  emailTemplates?: EmailTemplates;
  monthlyIncomeTarget?: number;
  currency?: string;
  language?: string;
  dateFormat?: string;
  invoicePrefix?: string;
  autoSync?: boolean;
  hasCompletedTour?: boolean;
}

export interface TimesheetEntry {
  id: string;
  description: string;
  loggedHours: number;
  date: string;
}

export interface Project {
  id: string;
  title: string;
  clientName: string;
  platform: Platform;
  amount: number;
  currency: string;
  status: ProjectStatus;
  date: string;
  deadline?: string;
  category?: string;
  notes?: string;
  estimatedHours?: number;
  difficultyRating?: number;
  satisfactionRating?: number;
  trackedSeconds?: number;
  isTimerRunning?: boolean;
  timerLastStartedAt?: string;
  tasks?: Array<{
    id: string;
    description: string;
    hours?: number;
    amount: number;
    isDone?: boolean;
  }>;
  communications?: Array<{
    id: string;
    date: string;
    message: string;
    isClient: boolean;
  }>;
  timesheets?: TimesheetEntry[];
}

export interface Invoice {
  id: string;
  projectId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: 'Pending' | 'Paid';
  paidDate?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'Payment' | 'Deadline' | 'System';
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: 'Yazılım' | 'Donanım' | 'Ofis' | 'Pazarlama' | 'Diğer';
  isRecurring?: boolean;
}

export interface AppData {
  profile: Profile;
  projects: Project[];
  invoices: Invoice[];
  notifications: Notification[];
  expenses: Expense[];
}
