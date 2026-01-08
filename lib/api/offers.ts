// lib/api/offers.ts
"use server"
import { OfferWithMusician, Offer } from "../utils/offers";
import { getMyOffersDb, getOffersForEventDb } from "../db/offers";

// イベントごとの応募一覧（店舗側で使用）
export async function getOffersForEvent(
  eventId: string
): Promise<OfferWithMusician[]> {
  return await getOffersForEventDb(eventId);
}
/**
 * ミュージシャン側：自分が応募した offers 一覧
 */
export async function getMyOffers(): Promise<Offer[]> {
  return await getMyOffersDb();
}

