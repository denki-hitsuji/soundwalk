export type MemberRow = {
  act_id: string;
  is_admin: boolean;
  status: string | null;
};
export type ActRow = {
  id: string;
  name: string;
  act_type: string | null;
  owner_profile_id: string;
  is_temporary: boolean;
  description: string | null;
  icon_url: string | null;
  photo_url: string | null;
  profile_link_url: string | null;
};

export type DetailsRow = {
  performance_id: string;
  load_in_time: string | null;
  set_start_time: string | null;
  set_end_time: string | null;
  set_minutes: number | null;
  customer_charge_yen: number | null;
  one_drink_required: boolean | null;
  notes: string | null;
};

export type AttachmentRow = {
  id: string;
  file_url: string;
  file_path: string | null;
  file_type: string;
  caption: string | null;
  created_at: string;
  performance_id: string;
};

export type MessageRow = {
    id: string;
    body: string;
    source: string | null;
    created_at: string;
};