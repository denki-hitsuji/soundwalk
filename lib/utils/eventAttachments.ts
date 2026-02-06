// lib/utils/eventAttachments.ts

export type EventAttachmentRow = {
  id: string;
  event_id: string;
  file_url: string;
  file_path: string | null;
  file_type: string;
  caption: string | null;
  created_at: string;
  uploaded_by_profile_id: string | null;
};

export type FlyerItem = {
  id: string;
  file_url: string;
  created_at: string;
  source: 'performance' | 'event';
};
