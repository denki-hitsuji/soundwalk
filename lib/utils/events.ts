import { ActRow } from "./acts";
import { BookingStatus } from "./bookings";

export type EventStatus = 'open' | 'pending' | 'draft' | 'matched' | 'cancelled';

export type EventRow = {
  id: string;
  organizer_profile_id: string;
  venue_id: string;
  title: string;
  event_date: string;
  open_time: string | null;
  start_time: string;
  end_time: string;
  max_artists: number | null;
  status: EventStatus;
  charge: number | null;
  conditions: string | null;
  created_at: string;
  reconfirm_deadline: string;
};


// VenueEventはビジネスロジックに移す方がよい？
export type EventWithVenue = EventRow & {
  venues: {
    id: string;
    name: string;
    address: string | null;
    volume_preference: string | null;
  } | null;
};
export type EventActRow =  {
  event_id: string;
  act_id: string;
  status: string;
  sort_order: number | null;
  created_at: string;
  act: ActRow;
};

export type EventWithAct = EventRow & {
     event_act: EventActRow;
};
export type EventWithCount = EventRow & {
  acceptedCount: number;
};
