// TODO: Define shared pagination, API response envelopes, and utility types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
