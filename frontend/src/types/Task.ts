export interface Task {
  id: string;
  plan_id: string; // Added to match usage in Dashboard.tsx
  task: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  progress_percentage: number;
  created_at: string;
  completed_at?: string;
  session_id: string;
  steps: PlanStep[];
  notes?: string;
}

export interface PlanStep {
  id: number;
  description: string;
  completed: boolean;
  status?: string;
}
