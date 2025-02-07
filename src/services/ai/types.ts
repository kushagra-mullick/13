export type TaskPriority = 'high' | 'medium' | 'low';

export interface TaskSummary {
  brief: string;
  keywords: string[];
  category: string;
}

export interface LocationPattern {
  visits: number;
  timeDistribution: number[];
  lastVisit: number;
}

export interface TaskContext {
  time?: Date;
  location?: {
    lat: number;
    lng: number;
    name?: string;
  };
  priority?: TaskPriority;
  recurring?: boolean;
  duration?: number;
}

export interface TaskSuggestion {
  task: string;
  category: string;
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
  categoryBreakdown: Record<string, number>;
  timeOfDayAnalysis: Record<string, number>;
  locationBasedCompletion: Record<string, number>;
  trends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
}