export interface Project {
  projectId: string;
  title: string;
  summary: string;
  description: string;
  thumbnailUrl: string;
  images: string[];
  tags: string[];
  teamName: string;
  members: string[];
  period: {
    start: string;
    end: string;
  };
  links: {
    github?: string;
    demo?: string;
    notion?: string;
  };
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPayload {
  projectId?: string;
  title: string;
  summary: string;
  description: string;
  thumbnailUrl: string;
  images: string[];
  tags: string[];
  teamName: string;
  members: string[];
  period: {
    start: string;
    end: string;
  };
  links: {
    github?: string;
    demo?: string;
    notion?: string;
  };
  isPinned: boolean;
}
