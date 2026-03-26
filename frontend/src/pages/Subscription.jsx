import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; // <-- ADDED THIS
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Subscription() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 1. Let React Router reliably grab the URL parameters
  const [searchParams] = useSearchParams();

  // Automatically fetch the checkout session when the page loads
  useEffect(() => {
    // Only attempt if the user is fully loaded
    if (!authLoading && user) {
      handleCheckout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 2. Read the parameters from the React Router hook instead of window.location
      const urlTier = searchParams.get('tier');
      const urlBilling = searchParams.get('billing');

      // 3. Default to their profile tier if no URL param exists
      const tierId = urlTier || user?.subscription_tier || 'eagle';
      const billingCycle = urlBilling || 'monthly';
      
      let priceId = '';

      // 4. Match the exact Stripe Price ID based on Monthly vs Annual
      if (billingCycle === 'monthly') {
        if (tierId === 'birdie') priceId = 'price_1TF9YO4JuqdjL3dVQ9fzUhUk';
        if (tierId === 'eagle') priceId = 'price_1TF9Yj4JuqdjL3dViz9myT83';
        if (tierId === 'albatross') priceId = 'price_1TF9Z14JuqdjL3dVkqhyHt8A';
      } else {
        // ANNUAL PLANS
        if (tierId === 'birdie') priceId = 'price_1TFA8N4JuqdjL3dV2JLsB5yx';
        if (tierId === 'eagle') priceId = 'price_1TFA8h4JuqdjL3dVZPcOweHm';
        if (tierId === 'albatross') priceId = 'price_1TFA8z4JuqdjL3dVql4JuUAo';
      }

      // Safety check
      if (!priceId) {
        throw new Error(`We could not find a Stripe Price ID for the ${tierId} plan.`);
      }

      // Call your backend route to create the Stripe Checkout Session
      const res = await api.post('/subscriptions/create-checkout-session', {
        priceId: priceId 
      });

      // Redirect the user's browser to the Stripe hosted payment page
      if (res.data.url) {
        window.location.replace(res.data.url);
      } else {
        throw new Error('Failed to generate checkout link');
      }

    } catch (err) {
      console.error(err);
      const serverError = err.response?.data?.error || err.message || "Unknown error occurred";
      setError(`Server says: ${serverError}`);
      setLoading(false);
    }
  };

  // If the auth context is still figuring out if they are logged in, wait.
  if (authLoading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <div className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card text-center" style={{ maxWidth: 500, padding: 'var(--space-8)' }}>
        <h2>Complete Your Subscription</h2>
        
        {error ? (
          <>
            <div style={{ color: '#dc3545', margin: 'var(--space-4) 0' }}>{error}</div>
            <button onClick={handleCheckout} className="btn btn-copper">Try Again</button>
          </>
        ) : (
          <>
            <p style={{ margin: 'var(--space-4) 0', color: 'var(--color-slate)' }}>
              We are securely transferring you to Stripe to complete your {searchParams.get('tier') || user?.subscription_tier || 'premium'} membership.
            </p>
            <div style={{ margin: 'var(--space-6) auto', width: '40px', height: '40px', border: '4px solid var(--color-copper)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p className="text-sm">Please do not refresh the page...</p>
          </>
        )}
      </div>
    </div>
  );
}