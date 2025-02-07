import { createClient } from '@supabase/supabase-js';
import { TaskCategory, TaskSuggestion, TaskContext, VoiceCommand } from './types';
import { processNaturalLanguage } from './nlp';
import { generateTaskSuggestions } from './suggestions';
import { analyzeVoiceCommand } from './voice';
import { analyzeTaskContext } from './context';
import { generateAnalytics } from './analytics';

// Re-export types and functions
export * from './types';
export * from './nlp';
export * from './suggestions';
export * from './voice';
export * from './context';
export * from './analytics';

// Task categories with associated keywords and patterns
export const taskCategories: Record<TaskCategory, string[]> = {
  work: ['meeting', 'presentation', 'deadline', 'project', 'client', 'report', 'email', 'office'],
  personal: ['gym', 'exercise', 'doctor', 'appointment', 'family', 'friend', 'hobby', 'workout'],
  errands: ['shopping', 'groceries', 'bank', 'post', 'pickup', 'delivery', 'repair', 'store'],
  health: ['medication', 'checkup', 'therapy', 'dentist', 'doctor', 'prescription', 'treatment'],
  social: ['party', 'dinner', 'lunch', 'coffee', 'meetup', 'date', 'gathering', 'event']
};

// AI service class for managing all AI-related functionality
export class AIService {
  private static instance: AIService;
  private lastLocation: { lat: number; lng: number } | null = null;
  private locationHistory: Array<{ lat: number; lng: number; timestamp: number }> = [];
  private taskPatterns: Map<string, number> = new Map();

  private constructor() {
    this.initializeLocationTracking();
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // Process natural language input
  public async processInput(input: string): Promise<{
    task: string;
    category: TaskCategory;
    context: TaskContext;
  }> {
    const processed = await processNaturalLanguage(input);
    const category = this.categorizeTask(processed.task);
    const context = await analyzeTaskContext(processed);
    
    return {
      task: processed.task,
      category,
      context
    };
  }

  // Categorize task based on content
  private categorizeTask(taskText: string): TaskCategory {
    const text = taskText.toLowerCase();
    
    for (const [category, keywords] of Object.entries(taskCategories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category as TaskCategory;
      }
    }
    
    return 'personal';
  }

  // Process voice command
  public async processVoiceCommand(audioBlob: Blob): Promise<VoiceCommand> {
    return await analyzeVoiceCommand(audioBlob);
  }

  // Generate task suggestions based on location and patterns
  public async generateSuggestions(
    latitude: number,
    longitude: number
  ): Promise<TaskSuggestion[]> {
    return await generateTaskSuggestions(latitude, longitude, this.taskPatterns);
  }

  // Track location for pattern recognition
  private initializeLocationTracking(): void {
    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.updateLocationHistory(latitude, longitude);
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true }
      );
    }
  }

  // Update location history for pattern recognition
  private updateLocationHistory(latitude: number, longitude: number): void {
    this.locationHistory.push({
      lat: latitude,
      lng: longitude,
      timestamp: Date.now()
    });

    // Keep only last 100 locations
    if (this.locationHistory.length > 100) {
      this.locationHistory.shift();
    }

    this.analyzeLocationPatterns();
  }

  // Analyze location patterns for suggestions
  private analyzeLocationPatterns(): void {
    // Implementation of location pattern analysis
    // This will be used for generating location-based suggestions
  }

  // Generate analytics report
  public async generateAnalyticsReport(): Promise<any> {
    return await generateAnalytics(this.taskPatterns, this.locationHistory);
  }
}

export const aiService = AIService.getInstance();