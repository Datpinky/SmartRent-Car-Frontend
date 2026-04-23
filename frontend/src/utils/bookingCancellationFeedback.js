const REFUND_STATUS_LABELS = {
  pending: 'dang xu ly',
  processing: 'dang xu ly',
  succeeded: 'da hoan tien',
  failed: 'that bai',
  canceled: 'da huy',
  requires_action: 'can xu ly them',
};

export const getCancelBookingNotice = (booking, cancelResult) => {
  const vehiclePart = booking?.vehicleName ? ` cho ${booking.vehicleName}` : '';
  const paymentStatus = cancelResult?.paymentStatus || booking?.paymentStatus || '';
  const refundStatus = cancelResult?.refundStatus || '';

  if (paymentStatus === 'refunded') {
    const refundLabel = REFUND_STATUS_LABELS[refundStatus] || refundStatus;
    const refundSuffix = refundLabel ? ` Trang thai refund: ${refundLabel}.` : '';

    return {
      tone: 'success',
      text: `Booking${vehiclePart} da duoc huy va he thong da ghi nhan hoan tien.${refundSuffix}`,
    };
  }

  if (paymentStatus === 'declined') {
    return {
      tone: 'warning',
      text: `Booking${vehiclePart} da duoc huy. Giao dich thanh toan chua hoan tat nen he thong da dong yeu cau thanh toan.`,
    };
  }

  return {
    tone: 'success',
    text: `Booking${vehiclePart} da duoc huy thanh cong.`,
  };
};
