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
    let ignore = false;

    const loadStripeConfig = async () => {
      try {
        setIsLoadingConfig(true);
        setStripeConfigError('');

        const config = await paymentService.getStripeConfig();
        const publishableKey = config?.publishableKey?.trim();

        if (!publishableKey) {
          throw new Error('Stripe publishable key is missing.');
        }

        if (!ignore) {
          setStripePromise(loadStripe(publishableKey));
        }
      } catch (err) {
        if (!ignore) {
          setStripeConfigError(err.message || 'Unable to load Stripe configuration.');
        }
      } finally {
        if (!ignore) {
          setIsLoadingConfig(false);
        }
      }
    };

    loadStripeConfig();

    return () => {
      ignore = true;
    };
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
