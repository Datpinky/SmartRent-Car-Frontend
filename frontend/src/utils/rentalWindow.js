const parseDateTime = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const sanitizeRentalWindow = (pickupDate = '', returnDate = '') => {
  const pickup = parseDateTime(pickupDate);
  const returnDateTime = parseDateTime(returnDate);

  if (!pickup || !returnDateTime || pickup.getTime() >= returnDateTime.getTime()) {
    return { pickupDate: '', returnDate: '' };
  }

  return { pickupDate, returnDate };
};

export const buildRentalWindowQuery = (pickupDate = '', returnDate = '') => {
  const window = sanitizeRentalWindow(pickupDate, returnDate);

  if (!window.pickupDate || !window.returnDate) {
    return '';
  }

  const params = new URLSearchParams({
    pickup: window.pickupDate,
    return: window.returnDate,
  });

  return `?${params.toString()}`;
};

export const resolveRentalWindow = ({ state, search } = {}) => {
  const fromState = sanitizeRentalWindow(
    state?.rentalSearch?.pickupDate || state?.pickupDate || '',
    state?.rentalSearch?.returnDate || state?.returnDate || ''
  );

  if (fromState.pickupDate && fromState.returnDate) {
    return fromState;
  }

  const params = new URLSearchParams(search || '');
  return sanitizeRentalWindow(params.get('pickup') || '', params.get('return') || '');
};
