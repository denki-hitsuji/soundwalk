export type EventStatus = 'open' | 'pending' | 'draft' | 'matched' | 'cancelled';

export type EventRow = {
  id: string;
  organizer_profile_id: string;
  venue_id: string;
  title: string;
  event_date: string; // YYYY-MM-DD
  open_time: string | null;
  start_time: string | null;
  end_time: string | null;
  max_artists: number | null;
  charge: number | null;
  conditions: string | null;
  status: EventStatus;
  created_at: string;
};

// VenueEbentはビジネスロジックに移す方がよい？
export type EventWithVenue = EventRow & {
  venues: {
    id: string;
    name: string;
    address: string | null;
    volume_preference: string | null;
  } | null;
};

// CRUD
