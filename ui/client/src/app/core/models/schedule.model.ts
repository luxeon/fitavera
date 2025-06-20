export interface ScheduleResponse {
  id: string;
  trainingId: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  defaultTrainerId: string;
  clientCapacity: number;
}

export interface SchedulePageItemResponse {
  id: string;
  trainingId: string;
  trainingName: string;
  defaultTrainerId: string;
  defaultTrainerFullName: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  clientCapacity: number;
}

export interface VisitRequest {
  scheduleId: string;
  date: string;
}

export interface VisitResponse {
  id: string;
  scheduleId: string;
  date: string;
  status: 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface UserVisit extends VisitResponse {
  scheduleName: string;
  startTime: string;
  endTime: string;
  locationName: string;
  trainerName?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      unsorted: boolean;
      sorted: boolean;
    };
    offset: number;
    unpaged: boolean;
    paged: boolean;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    unsorted: boolean;
    sorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

// New interfaces for ScheduleViewResponse
export interface ScheduleViewResponse {
  schedules: ScheduleViewItem[];
}

export interface ScheduleViewItem {
  id: string;
  startTime: string;
  endTime: string;
  clientCapacity: number;
  defaultTrainer: ScheduleViewTrainer;
  training: ScheduleViewTraining;
  sessions: ScheduleViewSession[];
}

export interface ScheduleViewTrainer {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ScheduleViewTraining {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
}

export interface ScheduleViewSession {
  date: string;
  registeredClientsCount: number;
}
