import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const API = import.meta.env.VITE_API_BASE || 'https://restaurant-pos-nh3m.onrender.com';
const C = { bg:'#16140F', ember:'#D9622B', muted:'#9A9384' };

function getDeviceId() {
  try {
    let id = localStorage.getItem('tf_device_id');
    if (!id) { id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('tf_device_id', id); }
    return id;
  } catch { return 'unknown'; }
}

function Loader() {
  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
      <div style={{ color:C.ember, fontSize:28, fontWeight:'bold' }}>🔥 TableFire</div>
      <div style={{ color:C.muted, fontSize:14 }}>Loading…</div>
    </div>
  );
}

function LoginScreen({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inp = { width:'100%', padding:'12px', borderRadius:8, border:'1px solid #39332A', background:'#201D17', color:'#F2ECDD', fontSize:15, fontFamily:'sans-serif', outline:'none', boxSizing:'border-box', marginBottom:12 };

  async function login() {
    if (!email || !key) { setError('Enter email and license key'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/restaurant/login`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: email.trim(), licenseKey: key.trim(), deviceId: getDeviceId() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('tf_session', data.sessionToken);
      localStorage.setItem('tf_restaurant_code', data.restaurantCode);
      localStorage.setItem('tf_restaurant_name', data.restaurantName || '');
      onSuccess();
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:360, fontFamily:'sans-serif' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:40 }}>🔥</div>
          <div style={{ color:C.ember, fontSize:24, fontWeight:'bold', letterSpacing:2, marginTop:8 }}>TABLEFIRE</div>
          <div style={{ color:C.muted, fontSize:13, marginTop:4 }}>Sign in to your restaurant</div>
        </div>
        <div style={{ fontSize:11, color:C.muted, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Email address</div>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="owner@restaurant.com" style={inp}/>
        <div style={{ fontSize:11, color:C.muted, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>License key</div>
        <input value={key} onChange={e=>setKey(e.target.value.toUpperCase().trim())} placeholder="TF-XXXX-XXXX-XXXX-XXXX" style={{...inp,fontFamily:'monospace'}} onKeyDown={e=>e.key==='Enter'&&login()}/>
        {error && <div style={{ color:'#C73E3E', fontSize:13, marginBottom:12, padding:'8px 12px', background:'#C73E3E15', borderRadius:6 }}>{error}</div>}
        <button onClick={login} disabled={loading} style={{ width:'100%', padding:14, borderRadius:8, border:'none', background:C.ember, color:'#fff', fontSize:15, fontWeight:'bold', cursor:'pointer' }}>
          {loading ? 'Signing in…' : 'Sign in →'}
        </button>
      </div>
    </div>
  );
}

function Root() {
  const path = window.location.pathname;
  const [Comp, setComp] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const code = localStorage.getItem('tf_restaurant_code');
    const token = localStorage.getItem('tf_session');
    if (code && token) setLoggedIn(true);

    const load = (path) => import(path)
      .then(m => setComp(() => m.default))
      .catch(e => setErr(e.message));

    if (path.startsWith('/owner'))    { load('./OwnerDashboard.jsx'); }
    else if (path.startsWith('/customer')) { load('./CustomerApp.jsx'); }
    else if (path.startsWith('/demo'))     { load('./DemoApp.jsx'); }
    else if (path.startsWith('/kitchen') || path.startsWith('/bar')) { load('./StationApp.jsx'); }
    else if (code && token)           { load('./App.jsx'); }

    setReady(true);
  }, []);

  if (err) return <div style={{color:'red',padding:20,background:'#111',minHeight:'100vh'}}>{err}</div>;
  if (!ready) return <Loader/>;

  const isSpecial = path.startsWith('/owner') || path.startsWith('/customer') || 
                    path.startsWith('/demo') || path.startsWith('/kitchen') || path.startsWith('/bar');

  if (isSpecial) return Comp ? <Comp/> : <Loader/>;
  if (!loggedIn) return <LoginScreen onSuccess={() => {
    setLoggedIn(true);
    import('./App.jsx').then(m => setComp(() => m.default)).catch(e => setErr(e.message));
  }}/>;
  return Comp ? <Comp/> : <Loader/>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
