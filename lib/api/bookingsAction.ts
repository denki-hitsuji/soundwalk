import { getCurrentUser } from "../auth/session.server";
import { createBookingDb, createOfferAndInboxPerformanceDb, updateBookingStatusDB } from "../db/bookings";
import { BookingStatus, BookingWithDetails } from "../utils/bookings";

export async function createBooking(params: {
  userId: string;
  eventId: string;
  actId: string;
  venueId: string;
  status: BookingStatus 
  message: string;
}) : Promise<BookingWithDetails> {
  const booking = await createBookingDb({
    eventId: params.eventId,
    actId: params.actId,
    venueId: params.venueId,
    status: params.status,
    message: params.message
  });
  await updateBookingStatus({ bookingId: booking.id, status: "accepted" });

  return booking;
}

export async function updateBookingStatus(params: {
  bookingId: string;
  status: "accepted" | "rejected";
}) {
  try {
    await updateBookingStatusDB({
      bookingId: params.bookingId,
      status: params.status
    });
  } catch (error) {
    throw error;
  }
} 

export async function createOfferAndInboxPerformance(params: { eventId: string, actId: string }) {
  return await createOfferAndInboxPerformanceDb(params);
}