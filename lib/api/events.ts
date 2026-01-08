// lib/api/events.ts
"use server";
import { getEventActsDb, getEventByIdDb, getEventPerformancesDb, getMyEventsDb, getOpenEventsForMusicianDb } from "@/lib/db/events";
import { EventWithVenue } from "../utils/events";
import { PerformanceRow } from "./performances";

export async function getMyEvents() {
  return await getMyEventsDb();
}

export async function getEventActs(params: { eventId: string }) {
  return await getEventActsDb(params);
}

export async function getEventById(eventId: string) {
  return await getEventByIdDb(eventId);
}

export async function getOpenEventsForMusician(): Promise<EventWithVenue[]> {
  return await getOpenEventsForMusicianDb();
}

export async function createEvent(input: {
  title: string;
  event_date: string;   // 'YYYY-MM-DD'
  start_time: string;   // 'HH:MM'
  end_time: string;     // 'HH:MM'
  max_artists: number;  // 対バン最大組数
}): Promise<void> { }

export async function updateEventDb(eventId: string, input: {
  title: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  max_artists: number | null;
}): Promise<void> { }

export async function deleteEvent(eventId: string): Promise<void> {
}

export async function getEventCountForVenueDb(venueId: string): Promise<number> {
  return await getEventCountForVenueDb(venueId);
}

export async function getEventCountForOrganizerDb(organizerProfileId: string): Promise<number> {
  return await getEventCountForOrganizerDb(organizerProfileId);
}

export async function getOpenEventCountDb(): Promise<number> {
  return await getOpenEventCountDb();
}

export async function getEventPerformances(params: {
  eventId: string;
}): Promise<PerformanceRow[]> {
  return await getEventPerformancesDb(params);
}