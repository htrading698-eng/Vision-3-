
import React, { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'

const pairs = [
  { label: 'BTC/USDT', tv: 'BINANCE:BTCUSDT', binance: 'BTCUSDT', fallback: 67500 },
  { label: 'ETH/USDT', tv: 'BINANCE:ETHUSDT', binance: 'ETHUSDT', fallback: 3200 },
  { label: 'SOL/USDT', tv: 'BINANCE:SOLUSDT', binance: 'SOLUSDT', fallback: 165 },
  { label: 'XRP/USDT', tv: 'BINANCE:XRPUSDT', binance: 'XRPUSDT', fallback: 0.52 },
  { label: 'HYPE/USDT', tv: 'COINEX:HYPEUSDT', binance: null, fallback: 32 },
  { label: 'SPX', tv: 'SP:SPX', binance: null, fallback: 5300 },
  { label: 'NAS100', tv: 'OANDA:NAS100USD', binance: null, fallback: 18500 }
]

const videos = [
  { title: 'Gestion du risque en trading', tag: 'Risk management', id: 'GL_YSlxzICg' },
  { title: 'Psychologie du trading', tag: 'Mindset', id: 'MXg4mrv-JDk' },
  { title: 'Analyse technique débutant', tag: 'Analyse', id: 'Pz43USJCyq8' },
  { title: 'Comment réussir son analyse technique', tag: 'Setup', id: '9rHSfw0d1u4' },
  { title: 'Calculer son risque en trading', tag: 'Position size', id: '4tkqx2LKd7g' }
]

function useLS(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
  }, [key, value])
  return [value, setValue]
}

function App() {
  const [pair, setPair] = useLS('vs_pair', pairs[0])
  const [price, setPrice] = useState(pair.fallback)
  const [lastUpdate, setLastUpdate] = useState('—')
  const [balance, setBalance] = useLS('vs_balance', 10000)
  const [margin, setMargin] = useLS('vs_margin', 500)
  const [leverage, setLeverage] = useLS('vs_leverage', 5)
  const [tpPct, setTpPct] = useLS('vs_tp', 3)
  const [slPct, setSlPct] = useLS('vs_sl', 2)
  const [riskPct, setRiskPct] = useLS('vs_risk', 1)
  const [position, setPosition] = useLS('vs_position', null)
  const [history, setHistory] = useLS('vs_history', [])
  const [selectedVideo, setSelectedVideo] = useState(videos[0])
  const [notes, setNotes] = useLS('vs_notes', '')

  useEffect(() => {
    let alive = true
    async function load() {
      if (!pair.binance) {
        setPrice(pair.fallback)
        setLastUpdate('simulation')
        return
      }
      try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${pair.binance}`)
        const data = await res.json()
        if (alive && data.price) {
          setPrice(Number(data.price))
          setLastUpdate(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
        }
      } catch {
        setPrice(pair.fallback)
        setLastUpdate('fallback')
      }
    }
    load()
    const id = setInterval(load, 3500)
    return () => { alive = false; clearInterval(id) }
  }, [pair])

  const notional = Number(margin) * Number(leverage)
  const qty = notional / Math.max(1e-9, Number(price))
  const pnl = useMemo(() => {
    if (!position) return 0
    const diff = position.side === 'LONG' ? Number(price) - position.entry : position.entry - Number(price)
    return diff * position.qty
  }, [position, price])
  const equity = Number(balance) + pnl
  const pnlPct = position ? (pnl / Math.max(1, Number(position.margin))) * 100 : 0
  const liq = position
    ? position.side === 'LONG'
      ? position.entry * (1 - (1 / Math.max(1, position.leverage)) * 0.92)
      : position.entry * (1 + (1 / Math.max(1, position.leverage)) * 0.92)
    : Number(price)
  const tpPrice = position
    ? position.side === 'LONG'
      ? position.entry * (1 + tpPct / 100)
      : position.entry * (1 - tpPct / 100)
    : 0
  const slPrice = position
    ? position.side === 'LONG'
      ? position.entry * (1 - slPct / 100)
      : position.entry * (1 + slPct / 100)
    : 0

  useEffect(() => {
    if (!position) return
    const hitTp = position.side === 'LONG' ? price >= tpPrice : price <= tpPrice
    const hitSl = position.side === 'LONG' ? price <= slPrice : price >= slPrice
    if (hitTp || hitSl) closePosition(hitTp ? 'TP' : 'SL')
  }, [price])

  function open(side) {
    if (position) return
    setPosition({
      pair: pair.label,
      side,
      entry: Number(price),
      qty,
      margin: Number(margin),
      leverage: Number(leverage),
      openedAt: new Date().toLocaleString('fr-FR')
    })
  }

  function closePosition(reason = 'MANUEL') {
    if (!position) return
    const closed = {
      ...position,
      close: Number(price),
      pnl,
      pnlPct,
      reason,
      closedAt: new Date().toLocaleString('fr-FR')
    }
    setHistory([closed, ...history].slice(0, 20))
    setBalance(Number(balance) + pnl)
    setPosition(null)
  }

  const card = { background:'linear-gradient(145deg,rgba(22,12,42,.96),rgba(8,5,18,.98))', border:'1px solid rgba(168,85,247,.22)', borderRadius:24, padding:18, boxShadow:'0 18px 60px rgba(0,0,0,.45)' }
  const input = { width:'100%', border:'1px solid rgba(168,85,247,.22)', background:'#0b0714', color:'#fff', borderRadius:14, padding:'12px 14px', outline:'none' }

  return (
    <div className="app">
      <style>{`
        *{box-sizing:border-box} body{margin:0;background:#05010a;color:#fff;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,sans-serif} button,input,textarea,select{font:inherit} button{cursor:pointer;touch-action:manipulation}
        .app{min-height:100vh;padding:18px 14px 90px;background:radial-gradient(circle at 75% 0%,rgba(147,51,234,.22),transparent 32%),#05010a}
        .wrap{max-width:1480px;margin:0 auto}.top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:22px}.brand{font-weight:950;letter-spacing:.06em}.brand span{color:#a855f7}.grid{display:grid;grid-template-columns:1fr;gap:16px}.stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.posstats{display:grid;grid-template-columns:repeat(auto-fit,minmax(138px,1fr));gap:10px}.btn{border:0;border-radius:14px;padding:13px 16px;color:white;font-weight:900}.purple{background:linear-gradient(135deg,#7c3aed,#a855f7)}.green{background:linear-gradient(135deg,#15803d,#22c55e)}.red{background:linear-gradient(135deg,#b91c1c,#ef4444)}.ghost{background:rgba(255,255,255,.06);border:1px solid rgba(168,85,247,.18);color:#ddd6fe}.muted{color:#a8a3bb}.small{font-size:12px}.videoList button{width:100%;text-align:left;margin-bottom:8px}.history{overflow-x:auto}.history table{width:100%;min-width:720px;border-collapse:collapse}.history th,.history td{padding:12px;border-bottom:1px solid rgba(168,85,247,.13);text-align:left}
        @media(min-width:1050px){.grid{grid-template-columns:1.35fr .65fr}.span2{grid-column:1/-1}.stats{grid-template-columns:repeat(4,minmax(0,1fr))}}
        @media(max-width:560px){.stats{grid-template-columns:1fr 1fr}.chart{height:390px!important}.top h1{font-size:34px!important}.hideMobile{display:none}}
      `}</style>
      <div className="wrap">
        <div className="top">
          <div>
            <div className="brand">VISION <span>SKOOL</span></div>
            <h1 style={{fontSize:46,lineHeight:1,margin:'12px 0 0'}}>Trading Paper Pro</h1>
            <p className="muted" style={{margin:'8px 0 0'}}>Simule, gère ton risque, journalise et progresse sans risquer ton capital.</p>
          </div>
          <div style={{padding:'10px 14px',border:'1px solid rgba(168,85,247,.24)',borderRadius:999,color:'#c084fc',fontWeight:900}}>PAPER TRADING</div>
        </div>

        <div className="stats">
          <div style={card}><div className="muted small">Solde</div><b style={{fontSize:24}}>{Number(balance).toLocaleString('fr-FR',{maximumFractionDigits:2})} €</b></div>
          <div style={card}><div className="muted small">Equity</div><b style={{fontSize:24}}>{equity.toLocaleString('fr-FR',{maximumFractionDigits:2})} €</b></div>
          <div style={card}><div className="muted small">PNL live</div><b style={{fontSize:24,color:pnl>=0?'#22c55e':'#f87171'}}>{pnl>=0?'+':''}{pnl.toFixed(2)} €</b></div>
          <div style={card}><div className="muted small">Trades</div><b style={{fontSize:24}}>{history.length}</b></div>
        </div>

        <div className="grid" style={{marginTop:16}}>
          <section style={card}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap',marginBottom:14}}>
              <div>
                <h2 style={{margin:0}}>Graphique TradingView</h2>
                <p className="muted" style={{margin:'6px 0 0'}}>Prix live Binance pour crypto principales.</p>
              </div>
              <select value={pair.label} onChange={e=>{const p=pairs.find(x=>x.label===e.target.value);setPair(p);setPrice(p.fallback)}} style={input}>
                {pairs.map(p=><option key={p.label}>{p.label}</option>)}
              </select>
            </div>
            <iframe className="chart" title="TradingView chart" src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(pair.tv)}&interval=15&theme=dark&style=1&timezone=Europe%2FParis&withdateranges=1&hidesidetoolbar=0`} style={{width:'100%',height:520,border:0,borderRadius:18,background:'#080512'}} />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:12}}>
              <div style={{...card,padding:12}}><div className="muted small">Prix actuel</div><b style={{fontSize:22}}>{Number(price).toLocaleString('fr-FR',{maximumFractionDigits:pair.fallback<1?5:2})}</b><div className="muted small">{lastUpdate}</div></div>
              <div style={{...card,padding:12}}><div className="muted small">Flux</div><b style={{color:pair.binance?'#22c55e':'#fbbf24'}}>{pair.binance?'Binance live':'TradingView + simulation'}</b></div>
            </div>
          </section>

          <section style={card}>
            <h2 style={{marginTop:0}}>Ouvrir une position</h2>
            <div style={{display:'grid',gap:10}}>
              <label className="small muted">Marge (€)<input type="number" value={margin} onChange={e=>setMargin(Number(e.target.value))} style={input}/></label>
              <label className="small muted">Levier (x)<input type="number" value={leverage} onChange={e=>setLeverage(Number(e.target.value))} style={input}/></label>
              <label className="small muted">Take Profit (%)<input type="number" value={tpPct} onChange={e=>setTpPct(Number(e.target.value))} style={input}/></label>
              <label className="small muted">Stop Loss (%)<input type="number" value={slPct} onChange={e=>setSlPct(Number(e.target.value))} style={input}/></label>
              <label className="small muted">Risque max conseillé (%)<input type="number" value={riskPct} onChange={e=>setRiskPct(Number(e.target.value))} style={input}/></label>
            </div>
            <div style={{...card,padding:12,marginTop:12}}>
              <div className="muted small">Notional</div><b>{notional.toLocaleString('fr-FR',{maximumFractionDigits:2})} €</b>
              <div className="muted small">Quantité estimée : {qty.toFixed(6)}</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:14}}>
              <button disabled={!!position} onClick={()=>open('LONG')} className="btn green" style={{opacity:position?.side?0.45:1}}>BUY / LONG</button>
              <button disabled={!!position} onClick={()=>open('SHORT')} className="btn red" style={{opacity:position?.side?0.45:1}}>SELL / SHORT</button>
            </div>
          </section>

          <section className="span2" style={card}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap',marginBottom:14}}>
              <div>
                <div style={{color:'#a855f7',fontWeight:950,letterSpacing:'.16em',fontSize:12}}>POSITION TERMINAL</div>
                <h2 style={{margin:'6px 0 0'}}>Position ouverte</h2>
              </div>
              <span style={{padding:'8px 11px',borderRadius:999,background:position?'rgba(34,197,94,.1)':'rgba(255,255,255,.05)',color:position?'#22c55e':'#aaa',fontWeight:900}}>{position?'LIVE':'AUCUNE'}</span>
            </div>

            {!position ? <div style={{padding:18,borderRadius:18,background:'rgba(255,255,255,.035)',color:'#aaa',textAlign:'center'}}>Aucune position ouverte.</div> : (
              <>
                <div className="posstats">
                  <div style={{...card,padding:12}}><div className="muted small">Symbole</div><b>{position.pair}</b><div style={{color:position.side==='LONG'?'#22c55e':'#f87171',fontWeight:900}}>{position.side} · {position.leverage}x</div></div>
                  <div style={{...card,padding:12}}><div className="muted small">PNL live</div><b style={{fontSize:24,color:pnl>=0?'#22c55e':'#f87171'}}>{pnl>=0?'+':''}{pnl.toFixed(2)} €</b><div style={{color:pnlPct>=0?'#22c55e':'#f87171'}}>{pnlPct>=0?'+':''}{pnlPct.toFixed(2)}%</div></div>
                  <div style={{...card,padding:12}}><div className="muted small">Marge</div><b>{position.margin.toLocaleString('fr-FR',{maximumFractionDigits:2})} €</b><div className="muted small">isolée</div></div>
                  <div style={{...card,padding:12}}><div className="muted small">Liq. estimée</div><b style={{color:'#fbbf24'}}>{liq.toLocaleString('fr-FR',{maximumFractionDigits:2})}</b></div>
                </div>
                <div className="posstats" style={{marginTop:10}}>
                  <div style={{...card,padding:12}}><div className="muted small">Entrée</div><b>{position.entry.toLocaleString('fr-FR',{maximumFractionDigits:2})}</b></div>
                  <div style={{...card,padding:12}}><div className="muted small">Prix actuel</div><b>{price.toLocaleString('fr-FR',{maximumFractionDigits:2})}</b></div>
                  <div style={{...card,padding:12}}><div className="muted small">TP</div><b style={{color:'#22c55e'}}>{tpPrice.toLocaleString('fr-FR',{maximumFractionDigits:2})}</b></div>
                  <div style={{...card,padding:12}}><div className="muted small">SL</div><b style={{color:'#f87171'}}>{slPrice.toLocaleString('fr-FR',{maximumFractionDigits:2})}</b></div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:12}}>
                  <button onClick={()=>setMargin(Number(margin)+100)} className="btn ghost">Ajouter 100€ marge</button>
                  <button onClick={()=>closePosition('MANUEL')} className="btn red">Fermer position</button>
                </div>
              </>
            )}
          </section>

          <section style={card}>
            <h2 style={{marginTop:0}}>Vidéos Trading FR</h2>
            <iframe title="video" src={`https://www.youtube.com/embed/${selectedVideo.id}`} allowFullScreen style={{width:'100%',height:260,border:0,borderRadius:18,background:'#000'}} />
            <div className="videoList" style={{marginTop:12}}>
              {videos.map(v => <button key={v.id} onClick={()=>setSelectedVideo(v)} className={selectedVideo.id===v.id?'btn purple':'btn ghost'}>{v.title}<br/><span className="small muted">{v.tag}</span></button>)}
            </div>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Tes notes sur la vidéo..." style={{...input,minHeight:110,marginTop:10}} />
            <div style={{marginTop:10,padding:12,borderRadius:14,background:'rgba(248,113,113,.08)',border:'1px solid rgba(248,113,113,.2)',color:'#fecaca'}}><b>Important :</b> les vidéos complètent la formation, elles ne remplacent pas le cours.</div>
          </section>

          <section style={card}>
            <h2 style={{marginTop:0}}>Journal intelligent</h2>
            <div className="history">
              <table>
                <thead><tr><th>Paire</th><th>Côté</th><th>Entrée</th><th>Sortie</th><th>PNL</th><th>Raison</th></tr></thead>
                <tbody>
                  {history.length === 0 ? <tr><td colSpan="6" className="muted">Aucun trade fermé.</td></tr> : history.map((t,i)=><tr key={i}><td>{t.pair}</td><td style={{color:t.side==='LONG'?'#22c55e':'#f87171'}}>{t.side}</td><td>{t.entry.toFixed(2)}</td><td>{t.close.toFixed(2)}</td><td style={{color:t.pnl>=0?'#22c55e':'#f87171'}}>{t.pnl>=0?'+':''}{t.pnl.toFixed(2)} €</td><td>{t.reason}</td></tr>)}
                </tbody>
              </table>
            </div>
          </section>

          <section className="span2" style={{...card,borderColor:'rgba(248,113,113,.28)'}}>
            <b style={{color:'#fecaca'}}>AVERTISSEMENT RISQUE</b>
            <p className="muted">Ce simulateur est éducatif. Le trading comporte des risques élevés et ne constitue pas un conseil financier. Ne trade jamais avec de l’argent que tu ne peux pas te permettre de perdre.</p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default App
