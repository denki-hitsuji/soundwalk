// lib/api/eventAttachmentsAction.ts
"use server";

import {
  getEventAttachmentsDb,
  uploadEventFlyerDb,
  deleteEventAttachmentDb,
} from "@/lib/db/eventAttachments";
import { EventAttachmentRow } from "@/lib/utils/eventAttachments";

/**
 * イベントのフライヤー一覧を取得
 */
export async function getEventAttachmentsAction(params: {
  eventId: string;
}): Promise<EventAttachmentRow[]> {
  return await getEventAttachmentsDb(params);
}

/**
 * イベントにフライヤーをアップロード
 */
export async function uploadEventFlyerAction(formData: FormData): Promise<void> {
  await uploadEventFlyerDb(formData);
}

/**
 * イベントのフライヤーを削除
 */
export async function deleteEventAttachmentAction(params: {
  eventId: string;
  attachmentId: string;
}): Promise<void> {
  await deleteEventAttachmentDb(params);
}
