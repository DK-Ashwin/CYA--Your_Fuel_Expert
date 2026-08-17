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
  CreditCard
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
  
  // App system state
  const [history, setHistory] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  // Update UPI ID dynamically based on selected provider and input
  useEffect(() => {
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
  }, [upiProvider, upiInput]);

  // Handle calculations
  const parsedMileage = parseFloat(mileage) || 0;
  const parsedDistance = parseFloat(distance) || 0;
  const parsedFuelPrice = parseFloat(fuelPrice) || 0;

  const totalFuelNeeded = parsedMileage > 0 ? parsedDistance / parsedMileage : 0;
  const totalCost = totalFuelNeeded * parsedFuelPrice;
  const costPerPerson = travelers.length > 0 ? totalCost / travelers.length : 0;

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

  // Handle History actions
  const handleSaveToHistory = () => {
    if (travelers.length === 0) return;

    const newRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      carName: carName.trim(),
      mileage: parsedMileage,
      distance: parsedDistance,
      fuelPrice: parsedFuelPrice,
      travelers: [...travelers],
      collectorName: collectorName,
      collectorUpiId: upiId,
      totalCost: totalCost,
      costPerPerson: costPerPerson
    };

    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('fuel_split_history', JSON.stringify(updatedHistory));
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReloadHistory = (record) => {
    setCarName(record.carName || '');
    setMileage(record.mileage.toString());
    setDistance(record.distance.toString());
    setFuelPrice(record.fuelPrice.toString());
    setTravelers(record.travelers);
    setCollectorName(record.collectorName);
    
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
    }
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
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-group">
          <Fuel size={32} className="logo-icon" />
          <h1 className="logo-text">Fuel Splitter</h1>
          <span className="logo-badge">UPI Ready</span>
        </div>
      </header>

      {/* Main Grid: Inputs vs Results */}
      <main className="dashboard-grid">
        {/* Left Side: Setup Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Card 1: Trip configuration */}
          <section className="glass-card accent-cyan">
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
          </section>

          {/* Card 2: Travelers dynamic list */}
          <section className="glass-card">
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
          </section>

          {/* Card 3: Collector & Payment Setup */}
          <section className="glass-card accent-cyan">
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
                    travelers.map((name, i) => (
                      <option key={i} value={name}>{name}</option>
                    ))
                  )}
                </select>
              </div>

              {travelers.length > 0 && (
                <>
                  <div className="upi-setup-row">
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
                </>
              )}
            </div>
          </section>
        </div>

        {/* Right Side: Results & QR Code Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Card 4: Trip Cost Calculation */}
          <section className="glass-card glow-cyan accent-cyan">
            <h2 className="card-title">
              Summary Breakdown
            </h2>

            <div className="cost-breakdown">
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

            <div className="btn-group">
              <button 
                className={`btn ${saveSuccess ? 'btn-success' : 'btn-primary'}`} 
                onClick={handleSaveToHistory}
                disabled={travelers.length === 0 || totalCost <= 0}
              >
                {saveSuccess ? (
                  <>
                    <Check size={18} />
                    Saved to History!
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save to History
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Card 5: Payment QR Display */}
          <section className="glass-card accent-emerald">
            <h2 className="card-title" style={{ color: 'var(--accent-emerald)' }}>
              <QrCode size={20} style={{ color: 'var(--accent-emerald)' }} />
              Scan to Pay
            </h2>

            <QRCodeDisplay 
              upiString={upiString} 
              amount={costPerPerson}
              collectorName={collectorName}
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
            
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <Info size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Other travelers can open their favorite payment app (GPay, PhonePe, Paytm, BHIM) and scan this QR code to transfer exactly <strong>₹{costPerPerson.toFixed(2)}</strong> directly to <strong>{collectorName}</strong>.
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* History Log Sidebar Panel */}
      <HistoryLog
        history={history}
        onReload={handleReloadHistory}
        onDelete={handleDeleteHistoryItem}
        onClearAll={handleClearAllHistory}
      />
    </div>
  );
}
