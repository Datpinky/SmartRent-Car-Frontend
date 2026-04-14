import React, { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import paymentService from '../../../services/paymentService';
import CheckoutContent from './CheckoutContent';

const Checkout = () => {
  const [stripePromise, setStripePromise] = useState(null);
  const [stripeConfigError, setStripeConfigError] = useState('');
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  useEffect(() => {
    const publishableKey = paymentService.getStripePublishableKey();

    if (!publishableKey) {
      setStripeConfigError('Chua cau hinh Stripe publishable key cho frontend.');
      setIsLoadingConfig(false);
      return;
    }

    setStripePromise(loadStripe(publishableKey));
    setStripeConfigError('');
    setIsLoadingConfig(false);
  }, []);

  if (isLoadingConfig) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Dang tai cong thanh toan...</div>;
  }

  return (
    <Elements stripe={stripePromise || null}>
      <CheckoutContent stripeConfigError={stripeConfigError} />
    </Elements>
  );
};

export default Checkout;
