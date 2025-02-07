export type TaskCategory = 'work' | 'personal' | 'errands' | 'health' | 'social';

export interface TaskContext {
  time?: Date;
  location?: {
    lat: number;
    lng: number;
    name?: string;
  };
  priority?: 'low' | 'medium' | 'high';
  recurring?: boolean;
  duration?: number;
}

export interface TaskSuggestion {
  task: string;
  category: TaskCategory;
  context: TaskContext;
  confidence: number;
}

export interface VoiceCommand {
  action: 'create' | 'complete' | 'delete' | 'update';
  taskId?: string;
  task?: string;
  context?: TaskContext;
}

export interface AnalyticsData {
  completionRate: number;
  categoryBreakdown: Record<TaskCategory, number>;
  timeOfDayAnalysis: Record<string, number>;
  locationBasedCompletion: Record<string, number>;
  trends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
}