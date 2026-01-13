export type BookingStatus = 'upcoming' | 'offered' | 'accepted' | 'completed' | 'pending' | 'cancelled';

export type BookingRow = {
  id: string;
  status: BookingStatus;
  message: string | null;
  created_at: string;
  event_id: string;
  act_id: string;
  act_name: string;
  act_type: string;
  act_icon_url: string;
  owner_profile_id: string | null;
};
export type BookingWithDetails = {
  id: string;
  event_id: string;
  musician_id: string;
  venue_id: string;
  status: BookingStatus;
  created_at: string;
  events: {
    id: string;
    title: string;
    event_date: string;
    start_time: string;
    end_time: string;
  } | null;
  venues: {
    id: string;
    name: string;
  } | null;
};

