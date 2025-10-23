export interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthFormData {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthError {
  message: string;
  status?: number;
}

