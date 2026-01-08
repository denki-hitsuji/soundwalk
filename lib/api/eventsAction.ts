import { updateEventStatusDb, upsertAllEventActsDb, upsertEventActDb, updateEventDb, removeEventActDb } from "../db/events";
import { EventStatus } from "../utils/events";

export async function updateEventStatus(params: {
  eventId: string;
  status: EventStatus;
}) {
  return await updateEventStatusDb(params);
}

export async function upsertAllEventActs(params: { eventId: string; actIds: string[]; }) {
  return await upsertAllEventActsDb(params);
}

export async function upsertEventAct(params: { eventId: string; actId: string; status: "pending" | "accepted" | "declined"; }) {
  return await upsertEventActDb(params);
}

export async function updateEvent(eventId: string, input: {
  title: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  max_artists: number | null;
}): Promise<void> {
  return await updateEventDb(eventId, input);
}

export async function removeEventAct(params: {
  eventId: string;
  actId: string;
}) {
  return await removeEventActDb(params);
}