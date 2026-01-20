"use server"
import { getMyActsDb, getMyOwnerActsDb, getMyMemberActsDb, getNextPerformanceDb, getActByIdDb, getActsByIdsDb, getAllActsDb, insertActDb, getActMembersDb } from "../db/acts";
import { ActRow } from "../utils/acts";

export async function getMyActs(): Promise<ActRow[]> {
  return await getMyActsDb();
}
export async function getMyOwnerActs(): Promise<ActRow[]> {
  return await getMyOwnerActsDb();
}
export async function getMyMemberActs(): Promise<ActRow[]> {
  return await getMyMemberActsDb();
}
export async function getNextPerformance() {
  return await getNextPerformanceDb();
}

export async function getActById(actId: string): Promise<ActRow | null> {
  return await getActByIdDb(actId);
}
export async function getActsByIds(actIds: string[]) {
  return await getActsByIdsDb(actIds);
}

export async function getAllActs(): Promise<ActRow[]> {
  return await getAllActsDb();
}
export async function getActMembers(params: { actId: string }) {
  return await getActMembersDb(params); 
}