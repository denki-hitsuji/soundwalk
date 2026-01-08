import { acceptOfferDb, applyToEventDb } from "../db/offers";
import { Offer } from "../utils/offers";

/**
 * ミュージシャンとして「イベントに応募」する
 */
export async function applyToEvent(eventId: string, message?: string): Promise<Offer> {
  return await applyToEventDb(eventId, message );
}

/**
 * 店舗側：応募を承認 → events.status更新 → bookings作成
 */
export async function acceptOffer(offerId: string) {
  return await acceptOfferDb(offerId);
}

