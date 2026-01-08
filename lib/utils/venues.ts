import { ActRow } from "../utils/acts";
import { BookingStatus } from "./bookings";
import { diffDays } from "./date";

// ===== 型定義 =====
export type VenueRow = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
    prefecture: string | null;
    short_name: string;
};

export type VenueBooking = {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  event_id: string;
  act_id: string;
  event?: Partial<Event>; // 必要に応じて page 側で埋める
  act: Pick<ActRow, "id" | "name" | "act_type" | "owner_profile_id">;
};


// 店舗側で使う：ミュージシャン情報もほしい版
export type VenueBookingWithDetails = {
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
  musicians: {
    id: string;
    genre: string | null;
    area: string | null;
    sample_video_url: string | null;
    bio: string | null;
    profiles: {
      display_name: string;
    } | null;
  } | null;
};