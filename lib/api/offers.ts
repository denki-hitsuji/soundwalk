// lib/api/offers.ts
"use server"
import { OfferWithMusician, Offer } from "../utils/offers";
import { acceptOfferDb, applyToEventDb, getMyOffersDb, getOffersForEventDb } from "../db/offers";

// イベントごとの応募一覧（店舗側で使用）
export async function getOffersForEvent(
  eventId: string
): Promise<OfferWithMusician[]> {
  return await getOffersForEventDb(eventId);
}

/**
 * ミュージシャンとして「イベントに応募」する
 */
export async function applyToEvent(eventId: string, message?: string): Promise<Offer> {
  return await applyToEventDb(eventId, message );
}

/**
 * ミュージシャン側：自分が応募した offers 一覧
 */
export async function getMyOffers(): Promise<Offer[]> {
  return await getMyOffersDb();
}

/**
 * 店舗側：応募を承認 → events.status更新 → bookings作成
 */
export async function acceptOffer(offerId: string) {
  return await acceptOfferDb(offerId);
}

