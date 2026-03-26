import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Subscription() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Automatically fetch the checkout session when the page loads
  useEffect(() => {
    // Only attempt if the user is fully loaded
    if (!authLoading && user) {
      handleCheckout();
    }
  }, [user, authLoading]);

    const handleCheckout = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 1. Read the URL to see exactly what the user clicked on the Pricing page
      const searchParams = new URLSearchParams(window.location.search);
      const urlTier = searchParams.get('tier');
      const urlBilling = searchParams.get('billing');

      // 2. Default to their profile tier if no URL param exists
      const tierId = urlTier || user?.subscription_tier || 'eagle';
      const billingCycle = urlBilling || 'monthly';
      
      let priceId = '';

      // 3. Match the exact Stripe Price ID based on Monthly vs Annual
      if (billingCycle === 'monthly') {
        if (tierId === 'birdie') priceId = 'price_1TF9Y04JuqdjL3dVQ9fzUhUk';
        if (tierId === 'eagle') priceId = 'price_1TF9Yj4JuqdjL3dViz9myT83';
        if (tierId === 'albatross') priceId = 'price_1TF9Z14JuqdjL3dVkqhyHt8A';
      } else {
        // ANNUAL PLANS - YOU MUST CREATE THESE IN STRIPE AND PASTE THE IDs HERE!
        if (tierId === 'birdie') priceId = 'price_1TFA8N4JuqdjL3dV2JLsB5yx';
        if (tierId === 'eagle') priceId = 'price_1TFA8h4JuqdjL3dVZPcOweHm';
        if (tierId === 'albatross') priceId = 'price_1TFA8z4JuqdjL3dVql4JuUAo';
      }

      // Safety check to make sure you updated the Annual IDs
      if (!priceId || priceId.includes('YOUR_ANNUAL')) {
        throw new Error(`You need to paste your Annual Stripe Price IDs into Subscription.jsx for the ${tierId} plan!`);
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
              We are securely transferring you to Stripe to complete your {user?.subscription_tier || 'premium'} membership.
            </p>
            <div style={{ margin: 'var(--space-6) auto', width: '40px', height: '40px', border: '4px solid var(--color-copper)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p className="text-sm">Please do not refresh the page...</p>
          </>
        )}
      </div>
    </div>
  );
}