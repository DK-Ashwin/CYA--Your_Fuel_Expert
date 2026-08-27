import React from 'react';
import { RotateCcw, Trash2, History, Car, Users, Calendar, Check, Lock, Unlock } from 'lucide-react';

export default function HistoryLog({ history, onReload, onDelete, onClearAll, onUpdatePaymentStatus }) {
  const [unlockedItems, setUnlockedItems] = React.useState({});
  const [enteredPins, setEnteredPins] = React.useState({});
  const [pinErrors, setPinErrors] = React.useState({});
  const [showUnlockInputs, setShowUnlockInputs] = React.useState({});
  const [pinAttempts, setPinAttempts] = React.useState({});
  const [lockoutTimeLeft, setLockoutTimeLeft] = React.useState({});

  React.useEffect(() => {
    const activeLockouts = Object.values(lockoutTimeLeft).some(time => time > 0);
    if (!activeLockouts) return;

    const timer = setInterval(() => {
      setLockoutTimeLeft(prev => {
        const next = { ...prev };
        let updated = false;
        for (const id in next) {
          if (next[id] > 0) {
            next[id] -= 1;
            updated = true;
            if (next[id] === 0) {
              setPinAttempts(attempts => {
                const nextAttempts = { ...attempts };
                delete nextAttempts[id];
                return nextAttempts;
              });
            }
          }
        }
        return updated ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutTimeLeft]);

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="glass-card history-sidebar" style={{ width: '100%' }}>
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
            Configure a trip, click "Calculate", and it will be auto-saved here.
          </span>
        </div>
      ) : (
        <>
          <div className="history-list">
            {history.map((item) => {
              const paidMap = item.paidTravelers || {};
              const totalTravelersCount = item.travelers.length;
              const paidCount = item.travelers.filter(t => paidMap[t]).length;
              const isCompleted = totalTravelersCount > 0 && paidCount === totalTravelersCount;
              const isItemLocked = isCompleted && item.pin && !unlockedItems[item.id];

              return (
                <div key={item.id} className={`history-item ${isCompleted ? 'completed-trip' : ''}`}>
                  <div className="history-item-header">
                    <span className="history-item-date">
                      <Calendar size={12} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
                      {formatDate(item.date)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isCompleted && (
                        <span className="completed-badge">
                          <Check size={10} style={{ marginRight: '2px' }} />
                          Completed
                        </span>
                      )}
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
                        Per Person ({totalTravelersCount}):
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

                  {/* Scrollable list of traveler payment checklist */}
                  <div className={`history-travelers-scroll ${isItemLocked ? 'locked-checklist-container' : ''}`}>
                    <div className="history-travelers-title">
                      <span>Travelers Paid ({paidCount}/{totalTravelersCount})</span>
                      {isCompleted && item.pin && (
                        <button
                          type="button"
                          className="history-lock-badge"
                          onClick={() => {
                            setShowUnlockInputs(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                          }}
                          style={{ background: 'none', border: 'none', font: 'inherit', color: 'inherit', padding: 0 }}
                        >
                          {isItemLocked ? (
                            <>
                              <Lock size={10} style={{ color: 'var(--accent-rose)' }} />
                              Locked
                            </>
                          ) : (
                            <>
                              <Unlock size={10} style={{ color: 'var(--accent-emerald)' }} />
                              Unlocked
                            </>
                          )}
                        </button>
                      )}
                      {onUpdatePaymentStatus && (
                        <select
                          className="history-item-inline-select"
                          onChange={(e) => {
                            if (e.target.value) {
                              const [name, statusStr] = e.target.value.split(':');
                              const isPaid = statusStr === 'true';
                              if (isItemLocked) {
                                alert('This payment checklist is completed and locked. Please unlock it using the PIN first.');
                                e.target.value = '';
                                return;
                              }
                              const newStatus = !isPaid;
                              onUpdatePaymentStatus(item.id, name, newStatus);
                              if (!newStatus) {
                                setUnlockedItems(prev => ({ ...prev, [item.id]: false }));
                              }
                              e.target.value = ''; // Reset select
                            }
                          }}
                          defaultValue=""
                          disabled={isItemLocked}
                        >
                          <option value="" disabled>Toggle paid status...</option>
                          {item.travelers.map((name) => (
                            <option key={name} value={`${name}:${paidMap[name] ? 'true' : 'false'}`}>
                              {name}: {paidMap[name] ? 'Mark Pending' : 'Mark Paid'}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {isItemLocked && showUnlockInputs[item.id] && (
                      <div className="history-inline-unlock-container">
                        <div className="history-unlock-row">
                          <input
                            type="password"
                            maxLength={4}
                            className="history-unlock-input"
                            placeholder={lockoutTimeLeft[item.id] > 0 ? `Locked (${lockoutTimeLeft[item.id]}s)` : "PIN"}
                            disabled={lockoutTimeLeft[item.id] > 0}
                            value={enteredPins[item.id] || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              if (val.length <= 4) {
                                setEnteredPins(prev => ({ ...prev, [item.id]: val }));
                                setPinErrors(prev => ({ ...prev, [item.id]: '' }));
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-secondary btn-action-sm"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', width: 'auto', minWidth: '60px', marginTop: 0 }}
                            disabled={lockoutTimeLeft[item.id] > 0}
                            onClick={() => {
                              if (lockoutTimeLeft[item.id] > 0) return;

                              if (enteredPins[item.id] === item.pin) {
                                setUnlockedItems(prev => ({ ...prev, [item.id]: true }));
                                setEnteredPins(prev => ({ ...prev, [item.id]: '' }));
                                setShowUnlockInputs(prev => ({ ...prev, [item.id]: false }));
                                setPinErrors(prev => ({ ...prev, [item.id]: '' }));
                                setPinAttempts(prev => {
                                  const next = { ...prev };
                                  delete next[item.id];
                                  return next;
                                });
                              } else {
                                const currentAttempts = (pinAttempts[item.id] || 0) + 1;
                                setPinAttempts(prev => ({ ...prev, [item.id]: currentAttempts }));

                                if (currentAttempts >= 4) {
                                  setLockoutTimeLeft(prev => ({ ...prev, [item.id]: 60 }));
                                  setPinErrors(prev => ({ ...prev, [item.id]: 'Too many incorrect attempts. Locked out for 60 seconds.' }));
                                  setEnteredPins(prev => ({ ...prev, [item.id]: '' }));
                                } else {
                                  setPinErrors(prev => ({ ...prev, [item.id]: `Incorrect PIN. (${currentAttempts}/4 attempts)` }));
                                }
                              }
                            }}
                          >
                            Unlock
                          </button>
                        </div>
                        {lockoutTimeLeft[item.id] > 0 ? (
                          <span style={{ fontSize: '0.65rem', color: 'var(--accent-rose)', textAlign: 'center', display: 'block' }}>
                            Too many incorrect attempts. Locked out for {lockoutTimeLeft[item.id]}s.
                          </span>
                        ) : pinErrors[item.id] && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--accent-rose)', textAlign: 'center', display: 'block' }}>
                            {pinErrors[item.id]}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="history-travelers-list">
                      {item.travelers.map((name) => (
                        <div 
                          key={name} 
                          className={`history-traveler-row ${paidMap[name] ? 'paid' : ''}`}
                          onClick={() => {
                            if (isItemLocked) {
                              setShowUnlockInputs(prev => ({ ...prev, [item.id]: true }));
                              return;
                            }
                            if (onUpdatePaymentStatus) {
                              const newStatus = !paidMap[name];
                              onUpdatePaymentStatus(item.id, name, newStatus);
                              if (!newStatus) {
                                setUnlockedItems(prev => ({ ...prev, [item.id]: false }));
                              }
                            }
                          }}
                          style={{ cursor: onUpdatePaymentStatus ? 'pointer' : 'default' }}
                          title={isItemLocked ? "Click to enter PIN and unlock" : (onUpdatePaymentStatus ? "Click to toggle payment status" : undefined)}
                        >
                          <span>
                            <span style={{ 
                              display: 'inline-block',
                              width: '6px', 
                              height: '6px', 
                              borderRadius: '50%', 
                              backgroundColor: paidMap[name] ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                              marginRight: '6px',
                              verticalAlign: 'middle'
                            }}></span>
                            {name} {name === item.collectorName && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>(Collector)</span>}
                          </span>
                          <span>{paidMap[name] ? 'Paid ✅' : 'Pending ⏳'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
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
