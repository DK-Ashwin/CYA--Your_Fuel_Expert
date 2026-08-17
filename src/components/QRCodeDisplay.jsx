import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

export default function QRCodeDisplay({ upiString, amount, collectorName }) {
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!canvasRef.current || !upiString) return;

    QRCode.toCanvas(
      canvasRef.current,
      upiString,
      {
        width: 180,
        margin: 2,
        color: {
          dark: '#0a0c10', // dark background matching body
          light: '#ffffff'
        }
      },
      (err) => {
        if (err) {
          console.error('QR code generation failed:', err);
          setError('Failed to generate QR Code');
        } else {
          setError(null);
        }
      }
    );
  }, [upiString]);

  if (!upiString) {
    return (
      <div className="qr-placeholder">
        <p style={{ fontSize: '0.85rem', padding: '0 1rem' }}>
          Enter collector's UPI details above to generate settlement QR code
        </p>
      </div>
    );
  }

  return (
    <div className="qr-section">
      {error ? (
        <p style={{ color: 'var(--accent-rose)', fontSize: '0.9rem' }}>{error}</p>
      ) : (
        <>
          <div className="qr-canvas-container">
            <canvas ref={canvasRef} />
          </div>
          <div className="upi-info-badge">
            <span>
              Pay <span className="upi-highlight">₹{parseFloat(amount || 0).toFixed(2)}</span> to{' '}
              <span className="upi-highlight">{collectorName || 'Collector'}</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
