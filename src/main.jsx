import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import Auth from './Auth.jsx';
import Workspace from './Workspace.jsx';
const modulePages=['Products','Variants','Plans','Taxes','Discounts','Templates','Quotations','Subscriptions','Customers','Staff'];

const money = v => '₹' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

async function api(path, options) {
  const r = await fetch('/api' + path, options);
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    if (!r.ok) throw Error(`Server returned ${r.status} ${r.statusText}. Please verify that the API server is running on port 3001.`);
    throw Error('Received unexpected HTML response instead of JSON. Please check Vite proxy or restart "npm run server".');
  }
  const d = await r.json();
  if (!r.ok) throw Error(d.error || 'Request failed');
  return d;
}

const post = (path, data) =>
  api(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data || {})
  });

function App() {
  const token = location.pathname.match(/^\/pay\/([a-f0-9]{64})$/)?.[1];
  const [user,setUser]=useState(null);
  const [showAuth,setShowAuth]=useState(!token);
  useEffect(()=>{localStorage.removeItem('cycvera_user');api('/auth/me').then(u=>{if(!u.anonymous){setUser(u);setShowAuth(false)}}).catch(()=>{})},[]);
  const [page, setPage] = useState(token ? 'Pay invoice' : 'Dashboard');
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({});
  const [number, setNumber] = useState(1);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [detail, setDetail] = useState(null);
  const [manual, setManual] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState({});

  const query = new URLSearchParams({ ...filters, page: number }).toString();

  function handleLogin(loggedInUser) {
    setUser(loggedInUser);

    setShowAuth(false);
  }

  async function handleSignOut() {
    await post('/auth/logout');
    setUser(null);
    localStorage.removeItem('cycvera_user');
    setShowAuth(true);
  }

  async function load() {
    if(modulePages.includes(page)) return;
    try {
      const path = token
        ? '/invoices/' + token
        : page === 'Dashboard'
        ? '/dashboard?' + query
        : page === 'Transactions'
        ? '/transactions?' + query
        : '/' + page.toLowerCase();
      setData(await api(path));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    api('/health').then(setHealth).catch(() => {});
    if(user)api('/invoices').then(setInvoices).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (showAuth) return;
    setData(null);
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [page, query, showAuth]);

  function filter(k, v) {
    setNumber(1);
    setFilters(f => ({ ...f, [k]: v }));
  }

  async function checkout() {
    setBusy(true);
    try {
      const order = await post('/invoices/' + token + '/order');
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = resolve;
          s.onerror = () => reject(Error('Checkout could not load'));
          document.head.append(s);
        });
      }
      new window.Razorpay({
        ...order,
        name: 'Cycvera',
        description: 'Invoice ' + data.invoice_number,
        prefill: { name: order.name, email: order.email, contact: order.phone },
        handler: () => {
          setNotice('Checkout completed. Waiting for verified payment confirmation…');
          load();
        },
        theme: { color: '#a16e4d' }
      }).open();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (showAuth) {
    return (
      <Auth
        onLogin={handleLogin}

      />
    );
  }

  const badge = s => (
    <span
      className={
        'badge ' +
        ({ captured: 'paid', created: 'draft', failed: 'overdue', refunded: 'paused' }[s] ||
          String(s).toLowerCase())
      }
    >
      {({ captured: 'Paid', created: 'Pending', failed: 'Failed', refunded: 'Refunded' }[s] || s)}
    </span>
  );

  const chart = (title, items) => (
    <div className="panel">
      <h2>{title}</h2>
      {items.map(x => (
        <div key={x.label} style={{ margin: '14px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span>{x.label}</span>
            <b>{money(x.amount)}</b>
          </div>
          <div style={{ height: 9, background: '#eee3d6', borderRadius: 9, marginTop: 7 }}>
            <div
              style={{
                height: '100%',
                background: '#a16e4d',
                borderRadius: 9,
                width: Math.max(1, (x.amount / Math.max(...items.map(a => a.amount), 1)) * 100) + '%'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brandmark">↻</span>Cycvera
        </div>
        <div className="group-label">FINANCE WORKSPACE</div>
        <nav className="nav">
          {(user?.role==='Customer'?['Dashboard','Transactions','Invoices','Subscriptions']:['Dashboard','Transactions','Invoices','Subscriptions','Customers','Products','Variants','Plans','Taxes','Discounts','Templates','Quotations',...(user?.role==='Admin'?['Staff']:[])]).map(p => (
            <button
              className={page === p ? 'active' : ''}
              onClick={() => {
                if (token) location.href = '/';
                else {
                  setData(null);
                  setPage(p);
                  setFilters({});
                  setNumber(1);
                }
              }}
              key={p}
            >
              {p}
            </button>
          ))}
        </nav>

        {user ? (
          <div style={{ padding: '12px 14px', background: '#e9dfd1', borderRadius: '12px', fontSize: '13px' }}>
            <div style={{ fontWeight: 700, color: '#3b3226' }}>{user.name}</div>
            <div style={{ color: '#8a7e6c', fontSize: '11px', marginTop: 2 }}>
              {user.role} · {user.email}
            </div>
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                className="secondary"
                style={{ padding: '5px 10px', fontSize: '11px', width: '100%' }}
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button
              type="button"
              className="primary"
              style={{ width: '100%', fontSize: '13px', padding: '9px 12px' }}
              onClick={() => setShowAuth(true)}
            >
              Log in / Sign up
            </button>
          </div>
        )}

        <div className="sidebar-bottom">
          <b>Razorpay test mode</b>
          <br />
          {health.gateway ? 'Gateway configured' : 'Add test keys in .env'}
          <br />
          {health.email ? 'Email configured' : 'Email delivery awaiting SMTP'}
        </div>
      </aside>

      <main className="main"><select className="mobilemenu secondary" value={page} onChange={e=>{setData(null);setPage(e.target.value)}}>{(user?.role==='Customer'?['Dashboard','Transactions','Invoices','Subscriptions']:['Dashboard','Transactions','Invoices',...modulePages.filter(p=>p!=='Staff'||user?.role==='Admin')]).map(p=><option key={p}>{p}</option>)}</select>
        <div className="heading">
          <div>
            <div className="eyebrow">Cycvera Software · Test mode</div>
            <h1>{page}</h1>
            <p>A clear view of every payment and every billing cycle.</p>
          </div>
          {page === 'Transactions' && user?.role!=='Customer' && (
            <button className="primary" onClick={() => setManual(true)}>
              + Record offline payment
            </button>
          )}
        </div>

        {modulePages.includes(page)&&user&&<Workspace key={page} page={page} user={user}/>}
        {error && (
          <p role="alert" className="panel" style={{ color: '#a35f55' }}>
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="panel">
            {notice}
          </p>
        )}

        {['Transactions', 'Dashboard'].includes(page) && (
          <div className="toolbar">
            <input aria-label="From date" type="date" onChange={e => filter('from', e.target.value)} />
            <input aria-label="To date" type="date" onChange={e => filter('to', e.target.value)} />
            {page === 'Transactions' && user?.role!=='Customer' && (
              <>
                <input
                  placeholder="Search customer, invoice or note"
                  onChange={e => filter('search', e.target.value)}
                />
                {['status', 'method'].map(k => (
                  <select key={k} onChange={e => filter(k, e.target.value)}>
                    <option value="">All {k}</option>
                    {(k === 'status'
                      ? ['created', 'captured', 'failed', 'refunded']
                      : ['upi', 'card', 'netbanking', 'cash', 'bank_transfer']
                    ).map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                ))}
                <input placeholder="Invoice number" onChange={e => filter('invoice', e.target.value)} />
                <input placeholder="Customer ID" onChange={e => filter('customer', e.target.value)} />
                <input type="number" placeholder="Min amount" onChange={e => filter('min', e.target.value)} />
                <input type="number" placeholder="Max amount" onChange={e => filter('max', e.target.value)} />
                <a className="secondary" href={'/api/transactions/export?' + query}>
                  Export CSV
                </a>
              </>
            )}
          </div>
        )}

        {!data && !error && !modulePages.includes(page) && <p>Loading your workspace…</p>}

        {data && page === 'Dashboard' && (
          <>
            <div className="cards">
              {[
                ['Active subscriptions', data.active],
                ['Monthly recurring revenue', money(data.mrr)],
                ['Collected this month', money(data.collected)],
                ['Outstanding', money(data.outstanding)],
                ['Overdue invoices', data.overdue.length]
              ].map(([a, b]) => (
                <div className="card" key={a}>
                  <div className="label">{a}</div>
                  <div className="value">{b}</div>
                </div>
              ))}
            </div>

            <div className="grid">
              {chart('Revenue by month', data.months)}
              {chart('Payments by method', data.methods)}
              {chart('Paid vs outstanding', [
                { label: 'Paid', amount: data.paid },
                { label: 'Outstanding', amount: data.outstanding }
              ])}
            </div>

            <div className="panel tablepanel">
              <h2>Overdue invoices</h2>
              <table>
                <thead>
                  <tr>
                    {['Invoice', 'Customer', 'Due', 'Balance', ''].map((x, i) => (
                      <th key={i}>{x}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.overdue.slice(0, 30).map(i => (
                    <tr key={i.id}>
                      <td>{i.invoice_number}</td>
                      <td>{i.customer}</td>
                      <td>{i.due_date}</td>
                      <td>{money((i.total - i.amount_paid) / 100)}</td>
                      <td>
                        <button
                          className="secondary"
                          onClick={() =>
                            post('/invoices/' + i.id + '/remind')
                              .then(r => setNotice(r.message))
                              .catch(e => setError(e.message))
                          }
                        >
                          Send reminder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {data && page === 'Transactions' && (
          <div className="panel tablepanel">
            <table>
              <thead>
                <tr>
                  {['Date', 'Invoice #', 'Customer', 'Method', 'Amount', 'Status', 'Note'].map(x => (
                    <th key={x}>{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map(p => (
                  <tr key={p.id} onClick={() => setDetail(p)} style={{ cursor: 'pointer' }}>
                    <td>{p.paid_on?.slice(0, 10)}</td>
                    <td>
                      <button className="secondary" onClick={() => setDetail(p)}>
                        {p.invoice_number}
                      </button>
                    </td>
                    <td>{p.customer}</td>
                    <td>{p.method}</td>
                    <td>{money(p.amount)}</td>
                    <td>{badge(p.status)}</td>
                    <td>{p.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="toolbar" style={{ marginTop: 20 }}>
              <button
                className="secondary"
                disabled={number === 1}
                onClick={() => setNumber(number - 1)}
              >
                Previous
              </button>
              <span>
                Page {number} · {data.total} transactions
              </span>
              <button
                className="secondary"
                disabled={number * 20 >= data.total}
                onClick={() => setNumber(number + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {data && page === 'Invoices' && (
          <div className="panel tablepanel">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Due</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.map(i => (
                  <tr key={i.id}>
                    <td>{i.invoice_number}</td>
                    <td>{i.customer}</td>
                    <td>{i.due_date}</td>
                    <td>{money(i.total)}</td>
                    <td>{money(i.amount_paid)}</td>
                    <td>{badge(i.status)}{user?.role!=='Customer'&&<div>{i.status==='Draft'&&<button onClick={()=>post('/invoices/'+i.id+'/confirm').then(load).catch(e=>setError(e.message))}>Confirm</button>}{!['Paid','Cancelled'].includes(i.status)&&i.amount_paid===0&&<button onClick={()=>post('/invoices/'+i.id+'/cancel').then(load).catch(e=>setError(e.message))}>Cancel</button>}</div>}</td>
                    <td>
                      <a href={'/pay/' + i.pay_token}>Pay now ↗</a> ·{' '}
                      <a href={'/api/invoices/' + i.pay_token + '/pdf'}>PDF</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && ['Customers', 'Subscriptions'].includes(page) && (
          <div className="panel tablepanel">
            <table>
              <thead>
                <tr>
                  {(page === 'Customers'
                    ? ['ID', 'Name', 'Email', 'Phone']
                    : ['Number', 'Customer', 'Plan', 'Status', 'Next bill']
                  ).map(x => (
                    <th key={x}>{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(x => (
                  <tr key={x.id}>
                    {(page === 'Customers'
                      ? [x.id, x.name, x.email, x.phone]
                      : [x.number, x.customer, x.plan, x.status, x.next_billing_date]
                    ).map((v, i) => (
                      <td key={i}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && token && (
          <div className="panel" style={{ maxWidth: 650 }}>
            <h2>{data.invoice_number}</h2>
            <p>
              {data.name} · Due {data.due_date}
            </p>
            <p>Invoice total: {money(data.total)}</p>
            <p>Received: {money(data.amount_paid)}</p>
            <h1>{money(Math.max(0, data.total - data.amount_paid))}</h1>
            {badge(data.status)}
            <p>Pay securely using UPI, card or netbanking through Razorpay.</p>
            <button
              className="primary"
              disabled={busy || ['Paid', 'Cancelled', 'Draft'].includes(data.status)}
              onClick={checkout}
            >
              {data.status === 'Paid'
                ? 'Payment received'
                : busy
                ? 'Opening checkout…'
                : 'Pay now'}
            </button>
            <p>
              <a href={'/api/invoices/' + token + '/pdf'}>Download invoice</a>
            </p>
          </div>
        )}
      </main>

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <aside
            className="panel"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 'min(450px,100%)',
              overflow: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button className="secondary" onClick={() => setDetail(null)}>
              Close
            </button>
            <h1>{money(detail.amount)}</h1>
            {badge(detail.status)}
            {[
              'invoice_number',
              'customer',
              'method',
              'paid_on',
              'gateway_payment_id',
              'gateway_order_id',
              'note'
            ].map(k => (
              <p key={k}>
                <small>{k.replaceAll('_', ' ')}</small>
                <br />
                {detail[k] || '—'}
              </p>
            ))}
            <p>
              <a href={'/api/transactions/' + detail.id + '/receipt'}>Download payment PDF</a>
            </p>
            <a href={'/api/invoices/' + detail.pay_token + '/pdf'}>Download invoice</a>
          </aside>
        </div>
      )}

      {manual && (
        <div className="modal-overlay">
          <form
            className="modal-card form"
            onSubmit={async e => {
              e.preventDefault();
              try {
                await post('/payments/manual', Object.fromEntries(new FormData(e.target)));
                setManual(false);
                load();
              } catch (e) {
                setError(e.message);
                setManual(false);
              }
            }}
          >
            <h2 className="field wide">Record offline payment</h2>
            <select name="invoice_id" required>
              {invoices
                .filter(i => !['Paid', 'Cancelled', 'Draft'].includes(i.status))
                .map(i => (
                  <option key={i.id} value={i.id}>
                    {i.invoice_number} · {money(i.total - i.amount_paid)}
                  </option>
                ))}
            </select>
            <select name="method">
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank transfer</option>
            </select>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Amount in INR"
              required
            />
            <input name="date" type="date" required />
            <input name="note" placeholder="Note" />
            <div className="formfooter">
              <button className="secondary" type="button" onClick={() => setManual(false)}>
                Cancel
              </button>
              <button className="primary">Record payment</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
