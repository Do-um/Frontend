export interface Introduce {
  id: number;
  activityId: string;
  description: string;
  activityImage: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntroduceApiResponse<T> {
  data: T;
  success: boolean;
  error: { code: string; message: string } | null;
}
