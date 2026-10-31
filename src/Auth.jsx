import React, { useState } from 'react';
import './auth.css';

const RE = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[+]?[\d\s-]{7,15}$/,
  aadhaar: /^\d{12}$/,
  upi: /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/
};

const TAKEN_EMAILS = ['demo@brightloop.app', 'admin@cycvera.example', 'sales@cycvera.example'];
const TEMP_PASSWORD = 'temp';
const WRONG_PASSWORD = 'wrong';

const PW_RULES = [
  { key: 'len', label: 'More than 8 characters', test: p => p.length > 8 },
  { key: 'upper', label: 'One uppercase letter', test: p => /[A-Z]/.test(p) },
  { key: 'lower', label: 'One lowercase letter', test: p => /[a-z]/.test(p) },
  { key: 'spec', label: 'One special character', test: p => /[^A-Za-z0-9]/.test(p) }
];

const pwValid = p => PW_RULES.every(r => r.test(p));
const normEmail = e => e.trim().toLowerCase();

function generatePassword() {
  const rnd = n => crypto.getRandomValues(new Uint32Array(1))[0] % n;
  const S = { u: 'ABCDEFGHJKLMNPQRSTUVWXYZ', l: 'abcdefghijkmnopqrstuvwxyz', d: '23456789', s: '!@#$%^&*?-_+=' };
  const all = S.u + S.l + S.d + S.s;
  const chars = [S.u[rnd(S.u.length)], S.l[rnd(S.l.length)], S.s[rnd(S.s.length)]];
  while (chars.length < 16) chars.push(all[rnd(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function nameFromEmail(e) {
  const n = e.split('@')[0].replace(/[._-]+/g, ' ').trim();
  return n.replace(/\b\w/g, c => c.toUpperCase()) || 'User';
}

function formatAadhaar(v) {
  return v.replace(/\D/g, '').slice(0, 12).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function maskAadhaar(d) {
  return 'XXXX XXXX ' + String(d || '').slice(-4);
}

export default function Auth({ onLogin, initialScreen = 'login', onSkipToDashboard }) {
  const [screen, setScreen] = useState(initialScreen);
  const [flash, setFlash] = useState(null);

  // Stored mock users created in session
  const [staffList, setStaffList] = useState([
    { name: 'Sarah Connor', email: 'sarah@cycvera.example', emp: 'EMP-102', created: '31/10/2026, 10:00:00 AM' }
  ]);
  const [adminList, setAdminList] = useState([
    { name: 'System Admin', email: 'admin@cycvera.example', emp: 'EMP-001', aadhaar: '987654321012', upi: 'admin@okaxis', created: '31/10/2026, 09:00:00 AM' }
  ]);

  // Form states
  const [role, setRole] = useState('Admin');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pw2, setPw2] = useState('');
  const [showPw2, setShowPw2] = useState(false);
  const [curPw, setCurPw] = useState('');
  const [showCurPw, setShowCurPw] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [emp, setEmp] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [locHint, setLocHint] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [upi, setUpi] = useState('');
  const [errors, setErrors] = useState({});
  const [copyStatus, setCopyStatus] = useState('Copy');
  const [adminTab, setAdminTab] = useState('staff');

  const banner = flash ? (
    <div className={`auth-banner ${flash.type}`} role="alert">
      {flash.msg}
    </div>
  ) : null;

  const wordmark = (
    <div className="auth-wordmark">
      Bright<span>loop</span> Software
    </div>
  );

  function resetForm() {
    setEmail('');
    setPw('');
    setPw2('');
    setCurPw('');
    setName('');
    setPhone('');
    setEmp('');
    setAddress('');
    setLat('');
    setLng('');
    setLocHint('');
    setAadhaar('');
    setUpi('');
    setErrors({});
  }

  function handleLocation() {
    if (!navigator.geolocation) {
      setLocHint('Geolocation is not supported by this browser.');
      return;
    }
    setLocHint('Locating…');
    navigator.geolocation.getCurrentPosition(
      p => {
        setLat(p.coords.latitude.toFixed(6));
        setLng(p.coords.longitude.toFixed(6));
        setLocHint('Location captured ✓');
      },
      err => {
        setLocHint('Could not get location: ' + err.message);
      }
    );
  }

  function handleLogin(e) {
    e.preventDefault();
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required.';
    else if (!RE.email.test(email.trim())) newErrors.email = 'Enter a valid email address.';
    if (!pw) newErrors.pw = 'Password is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (pw === WRONG_PASSWORD) {
      setFlash({ type: 'error', msg: 'Invalid email or password' });
      return;
    }

    const user = { name: nameFromEmail(email), email: email.trim(), role };
    if (pw === TEMP_PASSWORD) {
      setFlash({ type: 'error', msg: 'Temporary password detected. Please change your password.' });
      setScreen('change');
      return;
    }

    onLogin(user);
  }

  function handleCustomerSignup(e) {
    e.preventDefault();
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Full name is required.';
    if (!email.trim()) newErrors.email = 'Email is required.';
    else if (!RE.email.test(email.trim())) newErrors.email = 'Enter a valid email address.';
    else if (TAKEN_EMAILS.includes(normEmail(email))) newErrors.email = 'Email already registered.';
    if (!phone.trim()) newErrors.phone = 'Phone is required.';
    else if (!RE.phone.test(phone.trim())) newErrors.phone = 'Enter a valid phone number (7–15 digits).';
    if (!pwValid(pw)) newErrors.pw = 'Password does not meet all requirements.';
    if (pw !== pw2) newErrors.pw2 = 'Passwords do not match.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setFlash({ type: 'success', msg: 'Account created successfully! Please log in.' });
    resetForm();
    setScreen('login');
  }

  function handleStaffSignup(e) {
    e.preventDefault();
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Full name is required.';
    if (!email.trim()) newErrors.email = 'Email is required.';
    else if (!RE.email.test(email.trim())) newErrors.email = 'Enter a valid email address.';
    if (!phone.trim()) newErrors.phone = 'Phone is required.';
    else if (!RE.phone.test(phone.trim())) newErrors.phone = 'Enter a valid phone number (7–15 digits).';
    if (!emp.trim()) newErrors.emp = 'Employee ID is required.';
    if (!pwValid(pw)) newErrors.pw = 'Password does not meet all requirements.';
    if (pw !== pw2) newErrors.pw2 = 'Passwords do not match.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setStaffList(prev => [...prev, { name: name.trim(), email: email.trim(), emp: emp.trim(), created: new Date().toLocaleString() }]);
    setFlash({ type: 'success', msg: 'Staff account created. Please log in.' });
    resetForm();
    setScreen('login');
  }

  function handleAdminSignup(e) {
    e.preventDefault();
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Full name is required.';
    if (!email.trim()) newErrors.email = 'Email is required.';
    else if (!RE.email.test(email.trim())) newErrors.email = 'Enter a valid email address.';
    if (!phone.trim()) newErrors.phone = 'Phone is required.';
    else if (!RE.phone.test(phone.trim())) newErrors.phone = 'Enter a valid phone number (7–15 digits).';
    if (!emp.trim()) newErrors.emp = 'Employee ID is required.';
    const rawAadhaar = aadhaar.replace(/\s/g, '');
    if (!rawAadhaar) newErrors.aadhaar = 'Aadhaar is required.';
    else if (!RE.aadhaar.test(rawAadhaar)) newErrors.aadhaar = 'Aadhaar must be exactly 12 digits.';
    if (!upi.trim()) newErrors.upi = 'UPI ID is required.';
    else if (!RE.upi.test(upi.trim())) newErrors.upi = 'Enter a valid UPI ID (e.g. name@bank).';
    if (!pwValid(pw)) newErrors.pw = 'Password does not meet all requirements.';
    if (pw !== pw2) newErrors.pw2 = 'Passwords do not match.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setAdminList(prev => [...prev, { name: name.trim(), email: email.trim(), emp: emp.trim(), aadhaar: rawAadhaar, upi: upi.trim(), created: new Date().toLocaleString() }]);
    setFlash({ type: 'success', msg: 'Admin account created. Please log in.' });
    resetForm();
    setScreen('login');
  }

  function handleForgotPassword(e) {
    e.preventDefault();
    if (!email.trim() || !RE.email.test(email.trim())) {
      setErrors({ email: 'Enter a valid email address.' });
      return;
    }
    setFlash({ type: 'success', msg: 'If that email exists, a reset link has been sent.' });
  }

  function handleResetPassword(e) {
    e.preventDefault();
    const newErrors = {};
    if (!pwValid(pw)) newErrors.pw = 'Password does not meet all requirements.';
    if (pw !== pw2) newErrors.pw2 = 'Passwords do not match.';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setFlash({ type: 'success', msg: 'Password has been reset. Please log in.' });
    resetForm();
    setScreen('login');
  }

  function handleChangePassword(e) {
    e.preventDefault();
    const newErrors = {};
    if (!curPw) newErrors.curPw = 'Current password is required.';
    else if (curPw !== TEMP_PASSWORD) newErrors.curPw = 'Current password is incorrect (use "temp" for demo).';
    if (!pwValid(pw)) newErrors.pw = 'Password does not meet all requirements.';
    if (pw !== pw2) newErrors.pw2 = 'Passwords do not match.';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const user = { name: nameFromEmail(email || 'Admin'), email: email.trim() || 'user@cycvera.example', role: role || 'Admin' };
    setFlash({ type: 'success', msg: 'Password successfully updated.' });
    onLogin(user);
  }

  return (
    <div className="auth-container">
      <div className={`auth-box ${screen === 'admin-management' ? 'wide' : ''}`}>
        {wordmark}

        {/* SCREEN 1: LOGIN */}
        {screen === 'login' && (
          <section className="auth-card" aria-labelledby="login-heading">
            {banner}
            <h1 id="login-heading">Welcome back</h1>
            <p className="auth-sub">Log in to manage subscriptions.</p>
            <form onSubmit={handleLogin} noValidate>
              <div className="auth-field">
                <label htmlFor="role">Role</label>
                <select id="role" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="Admin">Admin</option>
                  <option value="Staff">Staff</option>
                  <option value="Customer">Customer</option>
                </select>
              </div>

              <div className="auth-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={errors.email ? 'bad' : ''}
                  placeholder="name@example.com"
                />
                {errors.email && <div className="auth-err">{errors.email}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="pw">Password</label>
                <div className="auth-pw">
                  <input
                    id="pw"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    className={errors.pw ? 'bad' : ''}
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    onClick={() => setShowPw(!showPw)}
                    aria-label="Toggle password visibility"
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.pw && <div className="auth-err">{errors.pw}</div>}
              </div>

              <div className="auth-field" style={{ marginTop: '-6px' }}>
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => { setFlash(null); setScreen('forgot'); }}
                >
                  Forgot password?
                </button>
              </div>

              <button className="auth-btn block" type="submit">
                Login
              </button>
            </form>

            <p className="auth-hint">
              Demo: password “<code>wrong</code>” = invalid, “<code>temp</code>” = forced change, anything else signs in.
            </p>

            <p className="auth-center auth-mt">
              Don't have an account?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => { resetForm(); setFlash(null); setScreen('signup'); }}
              >
                Sign up
              </button>
            </p>

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--auth-border)', textAlign: 'center', fontSize: '0.88rem' }}>
              <span>Or sign up as: </span>
              <button
                type="button"
                className="auth-link"
                onClick={() => { resetForm(); setFlash(null); setScreen('staff-signup'); }}
              >
                Staff
              </button>
              {' · '}
              <button
                type="button"
                className="auth-link"
                onClick={() => { resetForm(); setFlash(null); setScreen('admin-signup'); }}
              >
                Admin
              </button>
            </div>

            {onSkipToDashboard && (
              <p className="auth-center auth-mt">
                <button
                  type="button"
                  className="auth-btn ghost sm"
                  onClick={onSkipToDashboard}
                >
                  Continue to Workspace as Demo Mode →
                </button>
              </p>
            )}
          </section>
        )}

        {/* SCREEN 2: CUSTOMER SIGN UP */}
        {screen === 'signup' && (
          <section className="auth-card" aria-labelledby="signup-heading">
            {banner}
            <h1 id="signup-heading">Create your account</h1>
            <p className="auth-sub">Customer sign-up</p>
            <form onSubmit={handleCustomerSignup} noValidate>
              <div className="auth-field">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={errors.name ? 'bad' : ''}
                />
                {errors.name && <div className="auth-err">{errors.name}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={errors.email ? 'bad' : ''}
                />
                {email.trim() && RE.email.test(email.trim()) && (
                  <div className={`auth-hint ${TAKEN_EMAILS.includes(normEmail(email)) ? 'no' : 'ok'}`}>
                    {TAKEN_EMAILS.includes(normEmail(email)) ? '✗ This email is already registered.' : '✓ Email is available'}
                  </div>
                )}
                {errors.email && <div className="auth-err">{errors.email}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className={errors.phone ? 'bad' : ''}
                />
                {errors.phone && <div className="auth-err">{errors.phone}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="addr">
                  Address <span className="auth-opt">(optional)</span>
                </label>
                <textarea
                  id="addr"
                  rows={2}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
                <div className="auth-mt">
                  <button type="button" className="auth-btn ghost sm" onClick={handleLocation}>
                    Use my current location
                  </button>
                </div>
                {(lat || lng) && (
                  <div className="auth-grid auth-mt">
                    <div>
                      <label htmlFor="lat">Latitude</label>
                      <input id="lat" value={lat} readOnly />
                    </div>
                    <div>
                      <label htmlFor="lng">Longitude</label>
                      <input id="lng" value={lng} readOnly />
                    </div>
                  </div>
                )}
                {locHint && <div className="auth-hint ok">{locHint}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="signup-pw">Password</label>
                <div className="auth-pw">
                  <input
                    id="signup-pw"
                    type={showPw ? 'text' : 'password'}
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    className={errors.pw ? 'bad' : ''}
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
                <ul className="auth-checklist">
                  {PW_RULES.map(r => (
                    <li key={r.key} className={r.test(pw) ? 'pass' : ''}>
                      {r.label}
                    </li>
                  ))}
                </ul>
                {errors.pw && <div className="auth-err">{errors.pw}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="signup-pw2">Confirm password</label>
                <div className="auth-pw">
                  <input
                    id="signup-pw2"
                    type={showPw2 ? 'text' : 'password'}
                    value={pw2}
                    onChange={e => setPw2(e.target.value)}
                    className={errors.pw2 ? 'bad' : ''}
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    onClick={() => setShowPw2(!showPw2)}
                  >
                    {showPw2 ? 'Hide' : 'Show'}
                  </button>
                </div>
                {pw2 && (
                  <div className={`auth-hint ${pw === pw2 ? 'ok' : 'no'}`}>
                    {pw === pw2 ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}
                {errors.pw2 && <div className="auth-err">{errors.pw2}</div>}
              </div>

              <button className="auth-btn block" type="submit">
                Create account
              </button>
            </form>
            <p className="auth-center auth-mt">
              Already have an account?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => { resetForm(); setFlash(null); setScreen('login'); }}
              >
                Login
              </button>
            </p>
          </section>
        )}

        {/* SCREEN 3: STAFF SIGN UP */}
        {screen === 'staff-signup' && (
          <section className="auth-card" aria-labelledby="staff-signup-heading">
            {banner}
            <h1 id="staff-signup-heading">Staff sign up</h1>
            <p className="auth-sub">Create your employee account.</p>
            <form onSubmit={handleStaffSignup} noValidate>
              <div className="auth-field">
                <label htmlFor="staff-name">Full name</label>
                <input
                  id="staff-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={errors.name ? 'bad' : ''}
                />
                {errors.name && <div className="auth-err">{errors.name}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="staff-email">Email</label>
                <input
                  id="staff-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={errors.email ? 'bad' : ''}
                />
                {errors.email && <div className="auth-err">{errors.email}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="staff-phone">Phone</label>
                <input
                  id="staff-phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className={errors.phone ? 'bad' : ''}
                />
                {errors.phone && <div className="auth-err">{errors.phone}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="staff-emp">Employee ID</label>
                <input
                  id="staff-emp"
                  value={emp}
                  onChange={e => setEmp(e.target.value)}
                  className={errors.emp ? 'bad' : ''}
                  placeholder="EMP-103"
                />
                {errors.emp && <div className="auth-err">{errors.emp}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="staff-pw">Password</label>
                <div className="auth-pw">
                  <input
                    id="staff-pw"
                    type={showPw ? 'text' : 'password'}
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    className={errors.pw ? 'bad' : ''}
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
                <ul className="auth-checklist">
                  {PW_RULES.map(r => (
                    <li key={r.key} className={r.test(pw) ? 'pass' : ''}>
                      {r.label}
                    </li>
                  ))}
                </ul>
                {errors.pw && <div className="auth-err">{errors.pw}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="staff-pw2">Confirm password</label>
                <div className="auth-pw">
                  <input
                    id="staff-pw2"
                    type={showPw2 ? 'text' : 'password'}
                    value={pw2}
                    onChange={e => setPw2(e.target.value)}
                    className={errors.pw2 ? 'bad' : ''}
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    onClick={() => setShowPw2(!showPw2)}
                  >
                    {showPw2 ? 'Hide' : 'Show'}
                  </button>
                </div>
                {pw2 && (
                  <div className={`auth-hint ${pw === pw2 ? 'ok' : 'no'}`}>
                    {pw === pw2 ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}
                {errors.pw2 && <div className="auth-err">{errors.pw2}</div>}
              </div>

              <button className="auth-btn block" type="submit">
                Create staff account
              </button>
            </form>
            <p className="auth-center auth-mt">
              Already have an account?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => { resetForm(); setFlash(null); setScreen('login'); }}
              >
                Login
              </button>
            </p>
          </section>
        )}

        {/* SCREEN 4: ADMIN SIGN UP */}
        {screen === 'admin-signup' && (
          <section className="auth-card" aria-labelledby="admin-signup-heading">
            {banner}
            <h1 id="admin-signup-heading">Admin sign up</h1>
            <p className="auth-sub">Create your administrator account.</p>
            <form onSubmit={handleAdminSignup} noValidate>
              <div className="auth-field">
                <label htmlFor="adm-name">Full name</label>
                <input
                  id="adm-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={errors.name ? 'bad' : ''}
                />
                {errors.name && <div className="auth-err">{errors.name}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="adm-email">Email</label>
                <input
                  id="adm-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={errors.email ? 'bad' : ''}
                />
                {errors.email && <div className="auth-err">{errors.email}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="adm-phone">Phone</label>
                <input
                  id="adm-phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className={errors.phone ? 'bad' : ''}
                />
                {errors.phone && <div className="auth-err">{errors.phone}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="adm-emp">Employee ID</label>
                <input
                  id="adm-emp"
                  value={emp}
                  onChange={e => setEmp(e.target.value)}
                  className={errors.emp ? 'bad' : ''}
                  placeholder="ADM-002"
                />
                {errors.emp && <div className="auth-err">{errors.emp}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="adm-aad">Aadhaar</label>
                <input
                  id="adm-aad"
                  inputMode="numeric"
                  placeholder="XXXX XXXX XXXX"
                  maxLength={14}
                  value={aadhaar}
                  onChange={e => setAadhaar(formatAadhaar(e.target.value))}
                  className={errors.aadhaar ? 'bad' : ''}
                />
                {errors.aadhaar && <div className="auth-err">{errors.aadhaar}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="adm-upi">GPay / UPI ID</label>
                <input
                  id="adm-upi"
                  placeholder="name@bank"
                  value={upi}
                  onChange={e => setUpi(e.target.value)}
                  className={errors.upi ? 'bad' : ''}
                />
                {errors.upi && <div className="auth-err">{errors.upi}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="adm-pw">Password</label>
                <div className="auth-pw">
                  <input
                    id="adm-pw"
                    type={showPw ? 'text' : 'password'}
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    className={errors.pw ? 'bad' : ''}
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
                <ul className="auth-checklist">
                  {PW_RULES.map(r => (
                    <li key={r.key} className={r.test(pw) ? 'pass' : ''}>
                      {r.label}
                    </li>
                  ))}
                </ul>
                {errors.pw && <div className="auth-err">{errors.pw}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="adm-pw2">Confirm password</label>
                <div className="auth-pw">
                  <input
                    id="adm-pw2"
                    type={showPw2 ? 'text' : 'password'}
                    value={pw2}
                    onChange={e => setPw2(e.target.value)}
                    className={errors.pw2 ? 'bad' : ''}
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    onClick={() => setShowPw2(!showPw2)}
                  >
                    {showPw2 ? 'Hide' : 'Show'}
                  </button>
                </div>
                {pw2 && (
                  <div className={`auth-hint ${pw === pw2 ? 'ok' : 'no'}`}>
                    {pw === pw2 ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}
                {errors.pw2 && <div className="auth-err">{errors.pw2}</div>}
              </div>

              <button className="auth-btn block" type="submit">
                Create admin
              </button>
            </form>
            <p className="auth-center auth-mt">
              Already have an account?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => { resetForm(); setFlash(null); setScreen('login'); }}
              >
                Login
              </button>
            </p>
          </section>
        )}

        {/* SCREEN 5: FORGOT PASSWORD */}
        {screen === 'forgot' && (
          <section className="auth-card" aria-labelledby="forgot-heading">
            {banner}
            <h1 id="forgot-heading">Forgot password?</h1>
            <p className="auth-sub">Enter your email and we'll send a reset link.</p>
            <form onSubmit={handleForgotPassword} noValidate>
              <div className="auth-field">
                <label htmlFor="f-email">Email</label>
                <input
                  id="f-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={errors.email ? 'bad' : ''}
                />
                {errors.email && <div className="auth-err">{errors.email}</div>}
              </div>
              <button className="auth-btn block" type="submit">
                Send reset link
              </button>
            </form>
            <p className="auth-center auth-mt">
              <button
                type="button"
                className="auth-link"
                onClick={() => { setFlash(null); setScreen('login'); }}
              >
                Back to login
              </button>
            </p>
            <p className="auth-center auth-hint">
              Demo: <button type="button" className="auth-link" onClick={() => setScreen('reset')}>open the reset screen</button>
            </p>
          </section>
        )}

        {/* SCREEN 6: RESET PASSWORD */}
        {screen === 'reset' && (
          <section className="auth-card" aria-labelledby="reset-heading">
            {banner}
            <h1 id="reset-heading">Set a new password</h1>
            <p className="auth-sub">Choose a strong password.</p>
            <form onSubmit={handleResetPassword} noValidate>
              <div className="auth-field">
                <label htmlFor="r-pw">New password</label>
                <div className="auth-pw">
                  <input
                    id="r-pw"
                    type={showPw ? 'text' : 'password'}
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    className={errors.pw ? 'bad' : ''}
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
                <ul className="auth-checklist">
                  {PW_RULES.map(r => (
                    <li key={r.key} className={r.test(pw) ? 'pass' : ''}>
                      {r.label}
                    </li>
                  ))}
                </ul>
                {errors.pw && <div className="auth-err">{errors.pw}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="r-pw2">Confirm password</label>
                <div className="auth-pw">
                  <input
                    id="r-pw2"
                    type={showPw2 ? 'text' : 'password'}
                    value={pw2}
                    onChange={e => setPw2(e.target.value)}
                    className={errors.pw2 ? 'bad' : ''}
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    onClick={() => setShowPw2(!showPw2)}
                  >
                    {showPw2 ? 'Hide' : 'Show'}
                  </button>
                </div>
                {pw2 && (
                  <div className={`auth-hint ${pw === pw2 ? 'ok' : 'no'}`}>
                    {pw === pw2 ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}
                {errors.pw2 && <div className="auth-err">{errors.pw2}</div>}
              </div>

              <button className="auth-btn block" type="submit">
                Reset password
              </button>
            </form>
            <p className="auth-center auth-mt">
              <button
                type="button"
                className="auth-link"
                onClick={() => { setFlash(null); setScreen('login'); }}
              >
                Back to login
              </button>
            </p>
          </section>
        )}

        {/* SCREEN 7: FORCED CHANGE PASSWORD */}
        {screen === 'change' && (
          <section className="auth-card" aria-labelledby="change-heading">
            {banner}
            <h1 id="change-heading">Change your password</h1>
            <p className="auth-sub">You're using a temporary password. Set a new one to continue.</p>
            <form onSubmit={handleChangePassword} noValidate>
              <div className="auth-field">
                <label htmlFor="c-cur">Current password</label>
                <div className="auth-pw">
                  <input
                    id="c-cur"
                    type={showCurPw ? 'text' : 'password'}
                    value={curPw}
                    onChange={e => setCurPw(e.target.value)}
                    className={errors.curPw ? 'bad' : ''}
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    onClick={() => setShowCurPw(!showCurPw)}
                  >
                    {showCurPw ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.curPw && <div className="auth-err">{errors.curPw}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="c-pw">New password</label>
                <div className="auth-pw">
                  <input
                    id="c-pw"
                    type={showPw ? 'text' : 'password'}
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    className={errors.pw ? 'bad' : ''}
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
                <ul className="auth-checklist">
                  {PW_RULES.map(r => (
                    <li key={r.key} className={r.test(pw) ? 'pass' : ''}>
                      {r.label}
                    </li>
                  ))}
                </ul>
                {errors.pw && <div className="auth-err">{errors.pw}</div>}
              </div>

              <div className="auth-field">
                <label htmlFor="c-pw2">Confirm new password</label>
                <div className="auth-pw">
                  <input
                    id="c-pw2"
                    type={showPw2 ? 'text' : 'password'}
                    value={pw2}
                    onChange={e => setPw2(e.target.value)}
                    className={errors.pw2 ? 'bad' : ''}
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    onClick={() => setShowPw2(!showPw2)}
                  >
                    {showPw2 ? 'Hide' : 'Show'}
                  </button>
                </div>
                {pw2 && (
                  <div className={`auth-hint ${pw === pw2 ? 'ok' : 'no'}`}>
                    {pw === pw2 ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}
                {errors.pw2 && <div className="auth-err">{errors.pw2}</div>}
              </div>

              <button className="auth-btn block" type="submit">
                Change password
              </button>
            </form>
            <p className="auth-hint">Demo: current password must be “<code>temp</code>”.</p>
          </section>
        )}
      </div>
    </div>
  );
}
