import { useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function WinnerVerification() {
  const { drawId } = useParams();
  const [verificationCode, setVerificationCode] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a file.');
      return;
    }

    const formData = new FormData();
    formData.append('drawId', drawId);
    formData.append('verificationCode', verificationCode);
    formData.append('proof', file);

    try {
      const response = await api.post('/draws/verify-winner', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage(response.data.message);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
      setMessage('');
    }
  };

  return (
    <div className="score-page">
      <section className="section page-header">
        <div className="container" style={{ maxWidth: 700, textAlign: 'center' }}>
          <h1>Winner Verification</h1>
          <p>Verify your winning round and upload proof to claim your prize.</p>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <div className="card" style={{ padding: 'var(--space-8)' }}>
            <form onSubmit={handleVerify}>
              <div className="form-group">
                <label htmlFor="verificationCode">Verification Code</label>
                <input
                  type="text"
                  id="verificationCode"
                  className="input"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter the code from your email"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="proof">Proof of Score (Screenshot/Photo)</label>
                <input
                  type="file"
                  id="proof"
                  className="input"
                  onChange={handleFileChange}
                  accept="image/*"
                  required
                />
              </div>
              <button type="submit" className="button is-primary is-fullwidth" style={{ marginTop: 'var(--space-6)'}}>
                Verify and Submit
              </button>
            </form>
            {message && <p className="success-message" style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>{message}</p>}
            {error && <p className="error-message" style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>{error}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
