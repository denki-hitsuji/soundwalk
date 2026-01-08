// lib/utils/offers.ts
export type Offer = {
  id: string;
  event_id: string;
  musician_id: string;
  status: 'pending' | 'accepted' | 'declined';
  message: string | null;
  created_at: string;
};

export type OfferWithMusician = Offer & {
  musicians: {
    id: string;
    genre: string | null;
    volume: string | null;
    area: string | null;
    sample_video_url: string | null;
    bio: string | null;
    profiles: {
      display_name: string;
    } | null;
  } | null;
};

export type OfferStatus = 'pending' | 'accepted' | 'declined';
