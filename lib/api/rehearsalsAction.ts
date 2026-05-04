"use server";
import { revalidatePath } from "next/cache";
import { addRehearsalDb, deleteRehearsalDb } from "@/lib/db/rehearsals";

export async function addRehearsalAction(params: {
  act_id: string;
  rehearsal_date: string;
  start_time?: string | null;
  end_time?: string | null;
  studio_name?: string | null;
  memo?: string | null;
  performance_id?: string | null;
}): Promise<void> {
  await addRehearsalDb(params);
  revalidatePath("/musician/rehearsals");
  revalidatePath("/musician/calendar");
}

export async function deleteRehearsalAction(rehearsalId: string): Promise<void> {
  await deleteRehearsalDb(rehearsalId);
  revalidatePath("/musician/rehearsals");
  revalidatePath("/musician/calendar");
}
