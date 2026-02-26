export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'Admin' | 'Staff';
  canViewEmails: boolean;
  canViewCalls: boolean;
  canViewScheduling: boolean;
}

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  startTime: string;
  endTime: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  reminderSentSms: boolean;
  reminderSentEmail: boolean;
  reminderMinutesBefore: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailRule {
  id: string;
  name: string;
  isActive: boolean;
  matchField: 'Subject' | 'Body' | 'From' | 'Any';
  matchOperator: 'Contains' | 'StartsWith' | 'EndsWith' | 'Equals' | 'Regex';
  matchValue: string;
  replyTemplate: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  from: string;
  to: string;
  subject: string;
  bodySnippet?: string;
  receivedAt: string;
  ruleMatchedName?: string;
  autoReplySent: boolean;
  autoReplyAt?: string;
}

export interface PhoneCall {
  id: string;
  from: string;
  to: string;
  direction: 'inbound' | 'outbound';
  status: string;
  duration?: number;
  recordingUrl?: string;
  transcriptionText?: string;
  callStartedAt: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}
