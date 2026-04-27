const parseDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const UPCOMING_STATUSES = ['pending', 'confirmed', 'waiting_payment', 'paid', 'waiting_handover'];
export const ACTIVE_STATUSES = ['handed_over', 'in_use', 'waiting_return_confirmation'];
export const AWAITING_PAYMENT_STATUSES = ['pending', 'waiting_payment'];
export const SHOWROOM_PROCESSING_STATUSES = ['confirmed', 'paid'];
export const AWAITING_PICKUP_STATUSES = ['waiting_handover'];
export const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'waiting_payment', 'paid', 'waiting_handover'];
export const RENTAL_FLOW_STATUSES = ['waiting_handover', 'handed_over', 'in_use', 'waiting_return_confirmation', 'completed'];

const RECEIVE_READY_STATUSES = ['waiting_handover', 'handed_over', 'in_use', 'waiting_return_confirmation', 'completed'];
const RETURN_READY_STATUSES = ['handed_over', 'in_use', 'waiting_return_confirmation', 'completed'];

export const getBookingPaymentStatus = (booking) =>
  booking?.payment?.payment_status
  || booking?.paymentState?.paymentStatus
  || booking?.paymentStatus
  || (booking?.status === 'paid' ? 'successful' : 'pending');

export const getBookingFlowState = (booking, fallbackPaymentStatus) => {
  const rawBooking = booking?.raw || booking || {};
  const status = booking?.status || rawBooking.status || '';
  const paymentStatus = fallbackPaymentStatus || getBookingPaymentStatus(rawBooking);
  const startAt = parseDate(booking?.startDate || rawBooking.start_date || rawBooking.startDate);
  const endAt = parseDate(booking?.endDate || rawBooking.end_date || rawBooking.endDate);
  const now = Date.now();
  const hasStarted = Boolean(startAt) && now >= startAt.getTime();
  const hasEnded = Boolean(endAt) && now >= endAt.getTime();
  const isCancelled = ['cancelled', 'cancel_pending', 'cancel_failed'].includes(status);
  const isCompleted = status === 'completed';
  const hasSuccessfulPayment = paymentStatus === 'successful';
  const requiresRetryPayment = ['failed', 'declined'].includes(paymentStatus);
  const isAwaitingPayment =
    !isCancelled
    && !isCompleted
    && AWAITING_PAYMENT_STATUSES.includes(status)
    && !hasSuccessfulPayment
    && paymentStatus !== 'refunded';
  const isAwaitingShowroomProcessing =
    !isCancelled
    && !isCompleted
    && !isAwaitingPayment
    && paymentStatus !== 'refunded'
    && hasSuccessfulPayment
    && SHOWROOM_PROCESSING_STATUSES.includes(status);
  const isAwaitingPickup =
    !isCancelled
    && !isCompleted
    && !isAwaitingPayment
    && !isAwaitingShowroomProcessing
    && paymentStatus !== 'refunded'
    && hasSuccessfulPayment
    && AWAITING_PICKUP_STATUSES.includes(status);
  const pickupReadyByTime = startAt ? hasStarted : hasSuccessfulPayment;
  const canConfirmPickup =
    status === 'waiting_handover'
    && hasSuccessfulPayment
    && pickupReadyByTime;
  const timeBasedRentalAccess = false;

  const canOpenRentalFlow = RENTAL_FLOW_STATUSES.includes(status) || timeBasedRentalAccess;
  const canHandleReceive = RECEIVE_READY_STATUSES.includes(status) || timeBasedRentalAccess;
  const canHandleReturn = RETURN_READY_STATUSES.includes(status) || timeBasedRentalAccess;

  const isUpcoming =
    !isCancelled
    && !isCompleted
    && !timeBasedRentalAccess
    && (UPCOMING_STATUSES.includes(status) || (hasSuccessfulPayment && !hasStarted));

  const isActive =
    !isCancelled
    && !isCompleted
    && (ACTIVE_STATUSES.includes(status) || timeBasedRentalAccess);

  const effectiveFlowStatus = RENTAL_FLOW_STATUSES.includes(status)
    ? status
    : timeBasedRentalAccess
      ? hasEnded
        ? 'in_use'
        : 'handed_over'
      : 'waiting_handover';

  const rentalActionLabel = isCompleted
    ? 'Xem bien ban'
    : status === 'waiting_return_confirmation'
      ? 'Dang cho xac nhan'
      : canHandleReturn && hasEnded
        ? 'Tra xe ngay'
        : status === 'waiting_handover'
          ? 'Nhan xe'
          : canOpenRentalFlow
            ? 'Nhan / Tra xe'
            : '';

  const rentalAccessHint = timeBasedRentalAccess
    ? hasEnded
      ? 'Da qua han tra xe. Ban co the mo giao dien tra xe ngay.'
      : 'Da den lich thue. Ban co the mo quy trinh nhan / tra xe.'
    : '';
  const pickupConfirmationHint = !(isAwaitingPickup || isAwaitingShowroomProcessing)
    ? ''
    : requiresRetryPayment
      ? 'Thanh toan truoc do chua thanh cong. Vui long thanh toan lai de tiep tuc quy trinh nhan xe.'
      : !hasSuccessfulPayment
        ? 'Booking dang cho thanh toan. Sau khi payment thanh cong, showroom moi co the ban giao xe.'
        : isAwaitingShowroomProcessing
          ? 'Showroom dang xu ly booking va chuan bi ban giao xe. Nut xac nhan se mo khi booking chuyen sang Cho ban giao.'
          : !pickupReadyByTime && startAt
            ? `Nut xac nhan se mo tu ${startAt.toLocaleString('vi-VN')}.`
            : 'Sau khi xac nhan da nhan xe, booking se duoc chuyen sang Chuyen di cua toi.';

  return {
    canConfirmPickup,
    canHandleReceive,
    canHandleReturn,
    canOpenRentalFlow,
    effectiveFlowStatus,
    hasEnded,
    hasStarted,
    hasSuccessfulPayment,
    isActive,
    isAwaitingPayment,
    isAwaitingShowroomProcessing,
    isAwaitingPickup,
    isCancelled,
    isCompleted,
    isUpcoming,
    paymentStatus,
    pickupConfirmationHint,
    rentalAccessHint,
    rentalActionLabel,
    timeBasedRentalAccess,
  };
};
