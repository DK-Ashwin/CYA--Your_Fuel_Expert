import React, { useState, useEffect } from 'react';
import { 
  Fuel, 
  Users, 
  QrCode, 
  Plus, 
  Trash2, 
  Info, 
  ExternalLink, 
  Save, 
  Car, 
  TrendingUp, 
  Navigation,
  Check,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  History,
  Lock,
  Unlock
} from 'lucide-react';
import QRCodeDisplay from './components/QRCodeDisplay';
import HistoryLog from './components/HistoryLog';

export default function App() {
  // Input fields state
  const [carName, setCarName] = useState('');
  const [mileage, setMileage] = useState('15');
  const [distance, setDistance] = useState('100');
  const [fuelPrice, setFuelPrice] = useState('100');
  const [travelers, setTravelers] = useState(['You', 'Friend 1', 'Friend 2']);
  const [newTravelerName, setNewTravelerName] = useState('');
  
  // Payment state
  const [collectorName, setCollectorName] = useState('You');
  const [upiProvider, setUpiProvider] = useState('phonepe');
  const [upiInput, setUpiInput] = useState(''); // Mobile number or custom UPI ID
  const [upiId, setUpiId] = useState('');
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinAttempts, setPinAttempts] = useState(() => {
    return parseInt(localStorage.getItem('pin_attempts') || '0', 10);
  });
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(() => {
    const lockoutUntil = parseInt(localStorage.getItem('pin_lockout_until') || '0', 10);
    const timeLeft = Math.ceil((lockoutUntil - Date.now()) / 1000);
    return timeLeft > 0 ? timeLeft : 0;
  });
  
  // App system state
  const [history, setHistory] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // View and process wizard state
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator' | 'history'
  const [currentStep, setCurrentStep] = useState(1); // 1, 2, 3, 4
  const [paidTravelers, setPaidTravelers] = useState({});
  const [activeHistoryId, setActiveHistoryId] = useState(null);

  // Sync paidTravelers when travelers list or collector changes
  useEffect(() => {
    setPaidTravelers(prev => {
      const updated = {};
      travelers.forEach(name => {
        updated[name] = prev[name] !== undefined ? prev[name] : (name === collectorName);
      });
      if (collectorName) {
        updated[collectorName] = true;
      }
      return updated;
    });
  }, [travelers, collectorName]);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('fuel_split_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history from localStorage', e);
      }
    }
  }, []);

  // Timer countdown for PIN lockout
  useEffect(() => {
    if (lockoutTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setLockoutTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(timer);
          setPinAttempts(0);
          localStorage.removeItem('pin_attempts');
          localStorage.removeItem('pin_lockout_until');
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutTimeLeft]);

  // Update UPI ID dynamically based on selected provider and input
  useEffect(() => {
    if (upiProvider === 'nill' || collectorName === 'NILL') {
      setUpiId('');
      return;
    }

    const trimmed = upiInput.trim();
    if (!trimmed) {
      setUpiId('');
      return;
    }

    if (upiProvider === 'custom') {
      setUpiId(trimmed);
    } else {
      // Auto-generate standard format if input is a phone number or string
      // Clean phone number (keep digits)
      const cleanPhone = trimmed.replace(/\D/g, '');
      const base = cleanPhone.length === 10 ? cleanPhone : trimmed;

      if (upiProvider === 'phonepe') {
        setUpiId(`${base}@ybl`);
      } else if (upiProvider === 'paytm') {
        setUpiId(`${base}@paytm`);
      } else if (upiProvider === 'bhim') {
        setUpiId(`${base}@upi`);
      }
    }
  }, [upiProvider, upiInput, collectorName]);

  // Handle calculations
  const parsedMileage = parseFloat(mileage) || 0;
  const parsedDistance = parseFloat(distance) || 0;
  const parsedFuelPrice = parseFloat(fuelPrice) || 0;

  const totalFuelNeeded = parsedMileage > 0 ? parsedDistance / parsedMileage : 0;
  const totalCost = totalFuelNeeded * parsedFuelPrice;
  const costPerPerson = travelers.length > 0 ? totalCost / travelers.length : 0;

  const totalTravelersCount = travelers.length;
  const paidCount = travelers.filter(t => paidTravelers[t]).length;
  const isTripCompleted = totalTravelersCount > 0 && paidCount === totalTravelersCount;
  const isLocked = isTripCompleted && pin.length === 4 && !isUnlocked;

  // Build UPI string
  const upiString = upiId 
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(collectorName)}&am=${costPerPerson.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Fuel split for ' + (carName || 'Trip'))}`
    : '';

  // Handle Traveler actions
  const handleAddTraveler = (e) => {
    e.preventDefault();
    const name = newTravelerName.trim();
    if (!name) return;
    
    // Prevent duplicate traveler names
    if (travelers.includes(name)) {
      alert('Traveler with this name already exists.');
      return;
    }

    const updated = [...travelers, name];
    setTravelers(updated);
    setNewTravelerName('');
    
    // Default collector to first traveler if previously unselected
    if (travelers.length === 0) {
      setCollectorName(name);
    }
  };

  const handleRemoveTraveler = (index) => {
    const removedName = travelers[index];
    const updated = travelers.filter((_, i) => i !== index);
    setTravelers(updated);

    // If removed traveler was the collector, update collector to first remaining traveler or default
    if (collectorName === removedName) {
      setCollectorName(updated[0] || '');
    }
  };

  const handleUpdateTravelerName = (index, newName) => {
    const updated = [...travelers];
    const oldName = updated[index];
    updated[index] = newName;
    setTravelers(updated);

    if (collectorName === oldName) {
      setCollectorName(newName);
    }
  };

  // Handle Toggle Paid Status
  const handleTogglePaidStatus = (name) => {
    const newPaid = { ...paidTravelers, [name]: !paidTravelers[name] };
    setPaidTravelers(newPaid);

    // If we unlocked it manually but now someone is marked unpaid, reset the unlock state
    const newPaidCount = travelers.filter(t => newPaid[t]).length;
    const newTripCompleted = travelers.length > 0 && newPaidCount === travelers.length;
    if (!newTripCompleted) {
      setIsUnlocked(false);
    }

    // Sync with history if there is an active history item
    if (activeHistoryId) {
      const updatedHistory = history.map(item => {
        if (item.id === activeHistoryId) {
          return { ...item, paidTravelers: newPaid };
        }
        return item;
      });
      setHistory(updatedHistory);
      localStorage.setItem('fuel_split_history', JSON.stringify(updatedHistory));
    }
  };

  // Update payment status for an item in the history log directly
  const handleUpdateHistoryPaymentStatus = (itemId, travelerName, isPaid) => {
    const updatedHistory = history.map(item => {
      if (item.id === itemId) {
        const updatedPaid = { ...item.paidTravelers, [travelerName]: isPaid };
        return { ...item, paidTravelers: updatedPaid };
      }
      return item;
    });
    setHistory(updatedHistory);
    localStorage.setItem('fuel_split_history', JSON.stringify(updatedHistory));
    
    // If the reloaded/active item in the editor matches this history item, sync the editor state too
    if (activeHistoryId === itemId) {
      setPaidTravelers(prev => ({ ...prev, [travelerName]: isPaid }));
    }
  };



  const handleCalculateAndSave = () => {
    if (travelers.length === 0) return;

    if (collectorName !== 'NILL' && upiProvider !== 'nill' && !upiInput.trim()) {
      alert(`Please enter a valid ${upiProvider === 'custom' ? 'UPI ID' : 'Mobile Number'}.`);
      return;
    }

    if (collectorName !== 'NILL' && pin.length !== 4) {
      alert('Please set a 4-digit security PIN in Step 3 before generating the QR code.');
      return;
    }

    const isExisting = activeHistoryId && history.some(item => item.id === activeHistoryId);
    const recordId = isExisting ? activeHistoryId : Date.now().toString();

    let updatedPaid = { ...paidTravelers };
    if (!isExisting) {
      updatedPaid = {};
      travelers.forEach(name => {
        updatedPaid[name] = (name === collectorName);
      });
      setPaidTravelers(updatedPaid);
    } else {
      // Ensure all travelers in current travelers list have a value in updatedPaid
      travelers.forEach(name => {
        if (updatedPaid[name] === undefined) {
          updatedPaid[name] = (name === collectorName);
        }
      });
      // Remove any travelers that were deleted
      Object.keys(updatedPaid).forEach(name => {
        if (!travelers.includes(name)) {
          delete updatedPaid[name];
        }
      });
      setPaidTravelers(updatedPaid);
    }

    const newRecord = {
      id: recordId,
      date: isExisting ? (history.find(item => item.id === activeHistoryId)?.date || new Date().toISOString()) : new Date().toISOString(),
      carName: carName.trim() || 'Unnamed Trip',
      mileage: parsedMileage,
      distance: parsedDistance,
      fuelPrice: parsedFuelPrice,
      travelers: [...travelers],
      collectorName: collectorName,
      collectorUpiId: upiId,
      totalCost: totalCost,
      costPerPerson: costPerPerson,
      paidTravelers: updatedPaid,
      pin: pin
    };

    let updatedHistory;
    if (isExisting) {
      updatedHistory = history.map(item => item.id === recordId ? newRecord : item);
    } else {
      updatedHistory = [newRecord, ...history];
      setActiveHistoryId(recordId);
    }

    setHistory(updatedHistory);
    localStorage.setItem('fuel_split_history', JSON.stringify(updatedHistory));
    
    setIsUnlocked(false);
    setEnteredPin('');
    setPinError('');
    setCurrentStep(4);
  };

  const handleResetCalculator = () => {
    setCarName('');
    setDistance('100');
    setMileage('15');
    setFuelPrice('100');
    setTravelers(['You', 'Friend 1', 'Friend 2']);
    setCollectorName('You');
    setUpiProvider('phonepe');
    setUpiInput('');
    setUpiId('');
    setPaidTravelers({});
    setActiveHistoryId(null);
    setPin('');
    setIsUnlocked(false);
    setEnteredPin('');
    setPinError('');
    setCurrentStep(1);
  };

  const handleReloadHistory = (record) => {
    setCarName(record.carName || '');
    setMileage(record.mileage.toString());
    setDistance(record.distance.toString());
    setFuelPrice(record.fuelPrice.toString());
    setTravelers(record.travelers);
    setCollectorName(record.collectorName);
    
    // Load paid status and set active history ID
    setPaidTravelers(record.paidTravelers || {});
    setActiveHistoryId(record.id);

    // Load PIN
    setPin(record.pin || '');
    setIsUnlocked(false);
    setEnteredPin('');
    setPinError('');

    // Try to parse out the raw UPI inputs for the form fields
    if (record.collectorUpiId) {
      if (record.collectorUpiId.endsWith('@ybl')) {
        setUpiProvider('phonepe');
        setUpiInput(record.collectorUpiId.replace('@ybl', ''));
      } else if (record.collectorUpiId.endsWith('@paytm')) {
        setUpiProvider('paytm');
        setUpiInput(record.collectorUpiId.replace('@paytm', ''));
      } else if (record.collectorUpiId.endsWith('@upi')) {
        setUpiProvider('bhim');
        setUpiInput(record.collectorUpiId.replace('@upi', ''));
      } else {
        setUpiProvider('custom');
        setUpiInput(record.collectorUpiId);
      }
    } else {
      setUpiInput('');
      setUpiProvider('phonepe');
    }

    // Switch view to calculator and jump directly to Step 4 (UPI UI)
    setActiveTab('calculator');
    setCurrentStep(4);
  };

  const handleDeleteHistoryItem = (id) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('fuel_split_history', JSON.stringify(updatedHistory));
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to delete all saved trips from history?')) {
      setHistory([]);
      localStorage.removeItem('fuel_split_history');
    }
  };

  return (
    <div className={`app-container ${activeTab === 'history' || currentStep !== 4 ? 'full-width' : ''}`}>
      {/* Header */}
      <header className="app-header">
        <div className="logo-group">
          <img src={`${import.meta.env.BASE_URL}cya.png`} alt="CYA! Logo" style={{ height: '36px', borderRadius: '4px', filter: 'drop-shadow(0 0 8px var(--accent-cyan))' }} />
          <h1 className="logo-text">CYA!</h1>
          <span className="logo-badge">UPI Ready</span>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          <Fuel size={18} />
          Calculator
        </button>
        <button 
          className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={18} />
          Trip History
          {history.length > 0 && (
            <span className="nav-tab-badge">{history.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'calculator' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: currentStep === 4 ? '100%' : '600px', margin: '0 auto', width: '100%' }}>
          
          {/* Stepper Wizard Progress Bar */}
          <div className="stepper-container">
            <div className="stepper-line"></div>
            <div 
              className="stepper-line-progress" 
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            ></div>
            
            {[
              { step: 1, label: 'Trip Details' },
              { step: 2, label: 'Travelers' },
              { step: 3, label: 'UPI Config' },
              { step: 4, label: 'Summary & QR' }
            ].map((s) => (
              <div 
                key={s.step} 
                className={`step-bubble ${currentStep === s.step ? 'active' : ''} ${currentStep > s.step ? 'completed' : ''}`}
                onClick={() => {
                  if (s.step < currentStep) {
                    setCurrentStep(s.step);
                  } else if (s.step === 2 && parsedDistance > 0 && parsedMileage > 0 && parsedFuelPrice > 0) {
                    setCurrentStep(2);
                  } else if (s.step === 3 && travelers.length > 0) {
                    setCurrentStep(3);
                  }
                }}
              >
                {s.step}
                <span className="step-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Step 1: Trip Details */}
          {currentStep === 1 && (
            <section className="glass-card accent-cyan" style={{ animation: 'slideIn var(--transition-normal)' }}>
              <h2 className="card-title">
                <Car size={20} />
                Trip Details
              </h2>

              <div className="form-group">
                <label className="form-label" htmlFor="car-name">Car Model / Trip Name <span className="help-text">(Optional)</span></label>
                <div className="input-container">
                  <Car size={16} className="input-icon" />
                  <input
                    id="car-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Red Fort Roadtrip"
                    value={carName}
                    onChange={(e) => setCarName(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="distance">Distance <span className="accent-text">(km)</span></label>
                  <div className="input-container">
                    <Navigation size={16} className="input-icon" />
                    <input
                      id="distance"
                      type="number"
                      min="0"
                      step="any"
                      className="form-input"
                      placeholder="Distance"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="mileage">Mileage <span className="accent-text">(km/l)</span></label>
                  <div className="input-container">
                    <TrendingUp size={16} className="input-icon" />
                    <input
                      id="mileage"
                      type="number"
                      min="0.1"
                      step="any"
                      className="form-input"
                      placeholder="Avg. Mileage"
                      value={mileage}
                      onChange={(e) => setMileage(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="fuel-price">Fuel Price <span className="accent-text">(₹/liter)</span></label>
                <div className="input-container">
                  <span className="input-icon" style={{ fontSize: '0.95rem', fontWeight: 600, paddingLeft: '2px' }}>₹</span>
                  <input
                    id="fuel-price"
                    type="number"
                    min="0"
                    step="any"
                    className="form-input"
                    placeholder="Price per liter"
                    value={fuelPrice}
                    onChange={(e) => setFuelPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="step-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    if (parsedDistance <= 0 || parsedMileage <= 0 || parsedFuelPrice <= 0) {
                      alert('Please enter valid positive values for Distance, Mileage, and Fuel Price.');
                      return;
                    }
                    setCurrentStep(2);
                  }}
                >
                  Next: Add Travelers
                  <ChevronRight size={18} />
                </button>
              </div>
            </section>
          )}

          {/* Step 2: Travelers */}
          {currentStep === 2 && (
            <section className="glass-card" style={{ animation: 'slideIn var(--transition-normal)' }}>
              <h2 className="card-title">
                <Users size={20} />
                Travelers ({travelers.length})
              </h2>

              {travelers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No travelers added. Add travelers below to split the cost.
                </div>
              ) : (
                <div className="travelers-list">
                  {travelers.map((traveler, index) => (
                    <div key={index} className="traveler-row">
                      <div className="traveler-badge">
                        <input
                          type="text"
                          className="traveler-name-input"
                          value={traveler}
                          onChange={(e) => handleUpdateTravelerName(index, e.target.value)}
                        />
                        <button
                          className="btn-remove"
                          onClick={() => handleRemoveTraveler(index)}
                          title="Remove traveler"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddTraveler} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <input
                  type="text"
                  className="form-input form-input-no-icon"
                  placeholder="Add passenger name..."
                  value={newTravelerName}
                  onChange={(e) => setNewTravelerName(e.target.value)}
                />
                <button type="submit" className="btn btn-secondary btn-action-sm" style={{ width: 'auto', padding: '0.75rem 1rem' }}>
                  <Plus size={18} />
                </button>
              </form>

              <div className="step-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setCurrentStep(1)}
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    if (travelers.length === 0) {
                      alert('Please add at least one traveler.');
                      return;
                    }
                    setCurrentStep(3);
                  }}
                >
                  Next: UPI Setup
                  <ChevronRight size={18} />
                </button>
              </div>
            </section>
          )}

          {/* Step 3: Payment Settlement */}
          {currentStep === 3 && (
            <section className="glass-card accent-cyan" style={{ animation: 'slideIn var(--transition-normal)' }}>
              <h2 className="card-title">
                <CreditCard size={20} />
                Payment Settlement
              </h2>
              
              <div className="settlement-panel">
                <div className="form-group">
                  <label className="form-label" htmlFor="collector-select">Who is collecting the money?</label>
                  <select
                    id="collector-select"
                    className="dropdown-select"
                    value={collectorName}
                    onChange={(e) => setCollectorName(e.target.value)}
                    disabled={travelers.length === 0}
                  >
                    {travelers.length === 0 ? (
                      <option value="">Add travelers first...</option>
                    ) : (
                      <>
                        {travelers.map((name, i) => (
                          <option key={i} value={name}>{name}</option>
                        ))}
                        <option value="NILL">NILL (No UPI Collection)</option>
                      </>
                    )}
                  </select>
                </div>

                {travelers.length > 0 && collectorName !== 'NILL' && (
                  <>
                    <div className="upi-setup-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="provider-select">UPI App / ID</label>
                        <select
                          id="provider-select"
                          className="dropdown-select"
                          value={upiProvider}
                          onChange={(e) => {
                            setUpiProvider(e.target.value);
                            setUpiInput('');
                          }}
                        >
                          <option value="phonepe">PhonePe</option>
                          <option value="paytm">Paytm</option>
                          <option value="bhim">BHIM / UPI</option>
                          <option value="custom">Custom UPI ID</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="upi-input">
                          {upiProvider === 'custom' ? 'Enter UPI ID' : 'Mobile Number'}
                        </label>
                        <input
                          id="upi-input"
                          type="text"
                          className="form-input form-input-no-icon"
                          placeholder={
                            upiProvider === 'custom' 
                              ? 'e.g. name@axisbank' 
                              : 'e.g. 9876543210'
                          }
                          value={upiInput}
                          onChange={(e) => setUpiInput(e.target.value)}
                        />
                      </div>
                    </div>

                    {upiId && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.5rem' }}>
                        Generated UPI Target: <span className="accent-text">{upiId}</span>
                      </div>
                    )}

                    <div className="form-group" style={{ marginTop: '1.25rem' }}>
                      <label className="form-label" htmlFor="unlock-pin">
                        Set 4-Digit Unlock PIN <span className="help-text">(Required to lock/unlock settlement controls)</span>
                      </label>
                      <div className="input-container">
                        <Lock size={16} className="input-icon" />
                        <input
                          id="unlock-pin"
                          type="text"
                          maxLength={4}
                          className="form-input"
                          placeholder="e.g. 1234"
                          value={pin}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 4) {
                              setPin(val);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="step-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setCurrentStep(2)}
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
                <button 
                  className="btn btn-success"
                  onClick={handleCalculateAndSave}
                  disabled={travelers.length === 0}
                >
                  Calculate & Generate QR
                  <Check size={18} />
                </button>
              </div>
            </section>
          )}

          {/* Step 4: Final UPI Design & QR Results */}
          {currentStep === 4 && (
            <main className="dashboard-grid" style={{ animation: 'fadeInDown var(--transition-normal)', width: '100%' }}>
              
              {/* Summary Breakdown Card */}
              <section className="glass-card glow-cyan accent-cyan">
                <h2 className="card-title">
                  Summary Breakdown
                </h2>

                <div className="cost-breakdown">
                  <div className="cost-row">
                    <span className="cost-label">Trip / Car</span>
                    <span className="cost-value" style={{ fontSize: '1rem', color: 'var(--accent-cyan)' }}>
                      {carName || 'Unnamed Trip'}
                    </span>
                  </div>

                  <div className="cost-row">
                    <span className="cost-label">Total Fuel Required</span>
                    <span className="cost-value">
                      {totalFuelNeeded.toFixed(2)} liters
                    </span>
                  </div>

                  <div className="cost-row">
                    <span className="cost-label">Fuel Expense Total</span>
                    <span className="cost-value grand-total">
                      ₹{totalCost.toFixed(2)}
                    </span>
                  </div>

                  <div className="cost-row" style={{ borderBottom: 'none', paddingTop: '0.5rem' }}>
                    <span className="cost-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Cost Per Person</span>
                    <span className="cost-value grand-total" style={{ color: 'var(--accent-cyan)' }}>
                      ₹{costPerPerson.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button 
                    className="btn btn-primary"
                    onClick={handleResetCalculator}
                  >
                    <Plus size={18} />
                    Create New Trip
                  </button>
                </div>
              </section>

              {/* Scan to Pay QR Code Card */}
              <section className={`glass-card accent-emerald ${isLocked ? 'locked-checklist-container' : ''}`}>
                {isLocked && (
                  <div className="lock-overlay">
                    <div className="lock-box">
                      <div className="lock-title">
                        <Lock size={20} className="accent-rose" />
                        <span>Payment Completed</span>
                      </div>
                      <p className="lock-desc">
                        All payments have been completed. QR code and payment checklist are locked.
                      </p>
                      <input
                        type="password"
                        className="lock-input"
                        maxLength={4}
                        placeholder={lockoutTimeLeft > 0 ? `Locked (${lockoutTimeLeft}s)` : "••••"}
                        disabled={lockoutTimeLeft > 0}
                        value={enteredPin}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 4) {
                            setEnteredPin(val);
                            setPinError('');
                          }
                        }}
                      />
                      {lockoutTimeLeft > 0 ? (
                        <span className="lock-error">Too many incorrect attempts. Locked out for {lockoutTimeLeft}s.</span>
                      ) : pinError ? (
                        <span className="lock-error">{pinError}</span>
                      ) : null}
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-action-sm" 
                        style={{ width: '100%' }}
                        disabled={lockoutTimeLeft > 0}
                        onClick={() => {
                          if (lockoutTimeLeft > 0) return;

                          if (enteredPin === pin) {
                            setIsUnlocked(true);
                            setEnteredPin('');
                            setPinError('');
                            setPinAttempts(0);
                            localStorage.removeItem('pin_attempts');
                            localStorage.removeItem('pin_lockout_until');
                          } else {
                            const newAttempts = pinAttempts + 1;
                            setPinAttempts(newAttempts);
                            localStorage.setItem('pin_attempts', newAttempts.toString());

                            if (newAttempts >= 4) {
                              const lockoutUntil = Date.now() + 60000;
                              localStorage.setItem('pin_lockout_until', lockoutUntil.toString());
                              setLockoutTimeLeft(60);
                              setPinError('Too many incorrect attempts. Locked out for 60 seconds.');
                              setEnteredPin('');
                            } else {
                              setPinError(`Incorrect PIN. (${newAttempts}/4 attempts)`);
                            }
                          }
                        }}
                      >
                        <Unlock size={14} style={{ marginRight: '6px' }} />
                        Unlock Controls
                      </button>
                    </div>
                  </div>
                )}

                <h2 className="card-title" style={{ color: 'var(--accent-emerald)', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <QrCode size={20} style={{ color: 'var(--accent-emerald)' }} />
                    Scan to Pay
                  </span>
                  {isTripCompleted && (
                    <span className="lock-indicator-badge">
                      <Lock size={10} style={{ marginRight: '2px' }} />
                      Locked
                    </span>
                  )}
                </h2>

                <QRCodeDisplay 
                  upiString={upiString} 
                  amount={costPerPerson}
                  collectorName={collectorName}
                  upiProvider={upiProvider}
                />

                {upiString && (
                  <div className="mobile-only-btn">
                    <a 
                      href={upiString}
                      className="btn btn-primary"
                      style={{ textDecoration: 'none' }}
                    >
                      Pay via UPI App
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                {/* Dropdown list to mark manually who all has paid the due */}
                <div className="payment-status-section">
                  <div className="payment-status-title">
                    <span>Payment Checklist</span>
                    <select
                      className="dropdown-select"
                      style={{ width: 'auto', padding: '0.4rem 2rem 0.4rem 0.8rem', fontSize: '0.8rem', backgroundSize: '1rem', height: '32px' }}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleTogglePaidStatus(e.target.value);
                          e.target.value = ''; // Reset select value
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Mark payment status...</option>
                      {travelers.map((name, i) => (
                        <option key={i} value={name}>
                          {name}: {paidTravelers[name] ? 'Mark Pending' : 'Mark Paid'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="traveler-checklist">
                    {travelers.map((name) => (
                      <div 
                        key={name} 
                        className={`traveler-check-item ${paidTravelers[name] ? 'paid' : ''}`}
                        onClick={() => handleTogglePaidStatus(name)}
                        title="Click to toggle payment status"
                      >
                        <div className="check-item-info">
                          <span style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            backgroundColor: paidTravelers[name] ? 'var(--accent-emerald)' : 'var(--accent-amber)' 
                          }}></span>
                          {name} {name === collectorName && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(Collector)</span>}
                        </div>
                        <div className="check-item-status">
                          {paidTravelers[name] ? (
                            <span className="status-paid">Paid ✅</span>
                          ) : (
                            <span className="status-pending">Pending ⏳</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <Info size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    Scan QR or select names from the checklist to mark who has completed their transfer of <strong>₹{costPerPerson.toFixed(2)}</strong>.
                  </p>
                </div>
              </section>
            </main>
          )}

        </div>
      ) : (
        /* History Log Main Panel view */
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
          <HistoryLog
            history={history}
            onReload={handleReloadHistory}
            onDelete={handleDeleteHistoryItem}
            onClearAll={handleClearAllHistory}
            onUpdatePaymentStatus={handleUpdateHistoryPaymentStatus}
          />
        </div>
      )}
    </div>
  );
}
