export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  created_at: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'completed' | 'cancelled';
  owner_id: string;
  created_at: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  progress_pct: number;
  department: string;
  project_id: string;
  assigned_to: string | null;
  created_at: Date;
}

export interface SystemLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  created_at: Date;
}

export interface DepartmentProgress {
  department: string;
  total_tasks: string;
  avg_progress: string;
  completed_tasks: string;
}
