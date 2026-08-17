import React from 'react';
import { RotateCcw, Trash2, History, Car, Users, Calendar, Banknote } from 'lucide-react';

export default function HistoryLog({ history, onReload, onDelete, onClearAll }) {
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="glass-card history-sidebar">
      <div className="history-header">
        <h3 className="card-title" style={{ marginBottom: 0 }}>
          <History size={20} />
          History Log
        </h3>
        {history.length > 0 && (
          <span className="history-count">
            {history.length} {history.length === 1 ? 'trip' : 'trips'}
          </span>
        )}
      </div>

      {history.length === 0 ? (
        <div className="history-empty">
          <History size={40} />
          <p>No trip history saved yet.</p>
          <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
            Split a trip and click "Save to History" to log it.
          </span>
        </div>
      ) : (
        <>
          <div className="history-list">
            {history.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-item-header">
                  <span className="history-item-date">
                    <Calendar size={12} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
                    {formatDate(item.date)}
                  </span>
                  <div className="history-item-actions">
                    <button
                      className="btn-icon reload"
                      onClick={() => onReload(item)}
                      title="Load this trip details into the editor"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button
                      className="btn-icon delete"
                      onClick={() => onDelete(item.id)}
                      title="Delete this record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="history-item-title">
                  {item.carName ? `${item.carName}` : 'Unnamed Trip'}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <Car size={12} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
                  {item.distance} km @ {item.mileage} km/l
                </div>

                <div className="history-item-details">
                  <div>
                    <span className="history-detail-label">Total Cost:</span>
                  </div>
                  <div className="history-detail-value">
                    ₹{parseFloat(item.totalCost).toFixed(2)}
                  </div>

                  <div>
                    <span className="history-detail-label">
                      <Users size={10} style={{ marginRight: '3px', verticalAlign: 'text-bottom' }} />
                      Per Person ({item.travelers.length}):
                    </span>
                  </div>
                  <div className="history-detail-value highlight">
                    ₹{parseFloat(item.costPerPerson).toFixed(2)}
                  </div>

                  {item.collectorName && (
                    <>
                      <div>
                        <span className="history-detail-label">Collector:</span>
                      </div>
                      <div className="history-detail-value" style={{ color: 'var(--accent-cyan)' }}>
                        {item.collectorName}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {onClearAll && (
            <button
              className="btn btn-secondary btn-action-sm"
              onClick={onClearAll}
              style={{ marginTop: '1.25rem', width: '100%', borderColor: 'rgba(244, 63, 94, 0.2)', color: 'var(--accent-rose)' }}
            >
              <Trash2 size={14} />
              Clear All History
            </button>
          )}
        </>
      )}
    </div>
  );
}
