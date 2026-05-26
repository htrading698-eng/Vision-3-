import React, { useEffect, useMemo, useState } from 'react'

const PAIRS = [
  { label: 'BTC/USDT', value: 'BTCUSDT', tv: 'BINANCE:BTCUSDT', start: 77500 },
  { label: 'ETH/USDT', value: 'ETHUSDT', tv: 'BINANCE:ETHUSDT', start: 3200 },
  { label: 'SOL/USDT', value: 'SOLUSDT', tv: 'BINANCE:SOLUSDT', start: 165 },
  { label: 'XRP/USDT', value: 'XRPUSDT', tv: 'BINANCE:XRPUSDT', start: 0.52 },
  { label: 'NAS100', value: 'NAS100', tv: 'OANDA:NAS100USD', start: 18500 },
  { label: 'SPX', value: 'SPX', tv: 'SP:SPX', start: 5300 }
]

const VIDEOS = [
  { title: 'Gestion du risque en trading', tag: 'Risk management', id: 'GL_YSlxzICg' },
  { title: 'Psychologie du trading', tag: 'Mindset', id: 'MXg4mrv-JDk' },
  { title: 'Analyse technique débutant', tag: 'Analyse', id: 'Pz43USJCyq8' },
  { title: 'Comment réussir son analyse technique', tag: 'Setup', id: '9rHSfw0d1u4' },
  { title: 'Calculer son risque en trading', tag: 'Position size', id: '4tkqx2LKd7g' }
]

function App() {
  const [pair, setPair] = useState(PAIRS[0])
  const [price, setPrice] = useState(PAIRS[0].start)
  const [balance, setBalance] = useState(10000)
  const [margin, setMargin] = useState(500)
  const [leverage, setLeverage] = useState(5)
  const [tpPct, setTpPct] = useState(3)
  const [slPct, setSlPct] = useState(2)
  const [position, setPosition] = useState(null)
  const [history, setHistory] = useState([])
  const [video, setVideo] = useState(VIDEOS[0])
  const [notes, setNotes] = useState('')
  const [lastUpdate, setLastUpdate] = useState('simulation')

  useEffect(() => {
    setPrice(pair.start)
  }, [pair])

  useEffect(() => {
    let active = true

    async function fetchPrice() {
      if (pair.value === 'NAS100' || pair.value === 'SPX') {
        setPrice((old) => Number((old + (Math.random() - 0.5) * (pair.value === 'NAS100' ? 35 : 8)).toFixed(2)))
        setLastUpdate('simulation index')
        return
      }

      try {
        const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${pair.value}`)
        const data = await response.json()

        if (active && data.price) {
          setPrice(Number(data.price))
          setLastUpdate(new Date().toLocaleTimeString('fr-FR'))
        }
      } catch {
        setPrice((old) => Number((old + (Math.random() - 0.5) * 80).toFixed(2)))
        setLastUpdate('fallback simulation')
      }
    }

    fetchPrice()
    const timer = setInterval(fetchPrice, 3500)

    return () => {
      active = false
      clearInterval(timer)
    }
  }, [pair])

  const notional = Number(margin) * Number(leverage)
  const qty = notional / Math.max(price, 0.000001)

  const pnl = useMemo(() => {
    if (!position) return 0

    if (position.side === 'LONG') {
      return (price - position.entry) * position.qty
    }

    return (position.entry - price) * position.qty
  }, [position, price])

  const pnlPct = position ? (pnl / Math.max(position.margin, 1)) * 100 : 0
  const equity = balance + pnl

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

  const liquidationPrice = position
    ? position.side === 'LONG'
      ? position.entry * (1 - (1 / Math.max(position.leverage, 1)) * 0.9)
      : position.entry * (1 + (1 / Math.max(position.leverage, 1)) * 0.9)
    : price

  useEffect(() => {
    if (!position) return

    const takeProfitHit = position.side === 'LONG' ? price >= tpPrice : price <= tpPrice
    const stopLossHit = position.side === 'LONG' ? price <= slPrice : price >= slPrice

    if (takeProfitHit) closePosition('TP')
    if (stopLossHit) closePosition('SL')
  }, [price, position, tpPrice, slPrice])

  function openPosition(side) {
    if (position) return

    setPosition({
      side,
      pair: pair.label,
      entry: price,
      qty,
      margin: Number(margin),
      leverage: Number(leverage),
      openedAt: new Date().toLocaleString('fr-FR')
    })
  }

  function closePosition(reason = 'MANUEL') {
    if (!position) return

    const closedTrade = {
      ...position,
      exit: price,
      pnl,
      pnlPct,
      reason,
      closedAt: new Date().toLocaleString('fr-FR')
    }

    setHistory((items) => [closedTrade, ...items].slice(0, 20))
    setBalance((current) => current + pnl)
    setPosition(null)
  }

  return (
    <main className="app">
      <div className="shell">
        <header className="hero">
          <div>
            <p className="eyebrow">VISION SKOOL · PAPER TRADING</p>
            <h1>Trading Dashboard</h1>
            <p className="heroText">
              Entraîne-toi comme sur un compte démo : position, PNL live, TP/SL,
              journal et TradingView.
            </p>
          </div>

          <div className="badge">MODE SIMULATION</div>
        </header>

        <section className="stats">
          <article className="card stat">
            <span>Solde</span>
            <strong>{balance.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</strong>
          </article>

          <article className="card stat">
            <span>Equity</span>
            <strong>{equity.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</strong>
          </article>

          <article className="card stat">
            <span>PNL live</span>
            <strong className={pnl >= 0 ? 'greenText' : 'redText'}>
              {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} €
            </strong>
          </article>

          <article className="card stat">
            <span>Trades fermés</span>
            <strong>{history.length}</strong>
          </article>
        </section>

        <section className="grid">
          <article className="card chartCard">
            <div className="sectionHeader">
              <div>
                <h2>Graphique TradingView</h2>
                <p>Analyse visuelle du marché. Prix crypto live via Binance quand disponible.</p>
              </div>

              <select
                value={pair.value}
                onChange={(event) => {
                  const nextPair = PAIRS.find((item) => item.value === event.target.value)
                  setPair(nextPair)
                }}
              >
                {PAIRS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <iframe
              title="TradingView"
              src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(pair.tv)}&interval=15&theme=dark&style=1&timezone=Europe%2FParis&withdateranges=1&hidesidetoolbar=0`}
              className="chart"
            />

            <div className="miniGrid">
              <div>
                <span>Prix actuel</span>
                <strong>{price.toLocaleString('fr-FR', { maximumFractionDigits: pair.start < 1 ? 5 : 2 })}</strong>
                <small>{lastUpdate}</small>
              </div>

              <div>
                <span>Paire</span>
                <strong>{pair.label}</strong>
                <small>{pair.value === 'NAS100' || pair.value === 'SPX' ? 'simulation index' : 'Binance live'}</small>
              </div>
            </div>
          </article>

          <article className="card terminal">
            <h2>Ouvrir une position</h2>
            <p>Choisis ta marge, ton levier puis ouvre un LONG ou SHORT virtuel.</p>

            <label>
              Marge utilisée (€)
              <input type="number" value={margin} onChange={(event) => setMargin(Number(event.target.value))} />
            </label>

            <label>
              Levier
              <input type="number" value={leverage} onChange={(event) => setLeverage(Number(event.target.value))} />
            </label>

            <label>
              Take Profit (%)
              <input type="number" value={tpPct} onChange={(event) => setTpPct(Number(event.target.value))} />
            </label>

            <label>
              Stop Loss (%)
              <input type="number" value={slPct} onChange={(event) => setSlPct(Number(event.target.value))} />
            </label>

            <div className="summary">
              <span>Notional</span>
              <strong>{notional.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</strong>
              <small>Quantité estimée : {qty.toFixed(6)}</small>
            </div>

            <div className="actions">
              <button disabled={!!position} className="long" onClick={() => openPosition('LONG')}>
                BUY / LONG
              </button>

              <button disabled={!!position} className="short" onClick={() => openPosition('SHORT')}>
                SELL / SHORT
              </button>
            </div>
          </article>
        </section>

        <section className="card positionCard">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">POSITION TERMINAL</p>
              <h2>Position ouverte</h2>
              <p>Suivi style Bybit/Binance, mais simplifié pour mobile.</p>
            </div>

            <span className={position ? 'liveStatus' : 'emptyStatus'}>
              {position ? 'LIVE' : 'AUCUNE'}
            </span>
          </div>

          {!position ? (
            <div className="emptyBox">Aucune position ouverte pour le moment.</div>
          ) : (
            <>
              <div className="positionGrid">
                <div>
                  <span>Symbole</span>
                  <strong>{position.pair}</strong>
                  <small className={position.side === 'LONG' ? 'greenText' : 'redText'}>
                    {position.side} · {position.leverage}x
                  </small>
                </div>

                <div>
                  <span>PNL live</span>
                  <strong className={pnl >= 0 ? 'greenText' : 'redText'}>
                    {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} €
                  </strong>
                  <small className={pnlPct >= 0 ? 'greenText' : 'redText'}>
                    {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                  </small>
                </div>

                <div>
                  <span>Marge</span>
                  <strong>{position.margin.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</strong>
                  <small>isolée</small>
                </div>

                <div>
                  <span>Liquidation estimée</span>
                  <strong className="goldText">
                    {liquidationPrice.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                  </strong>
                </div>

                <div>
                  <span>Entrée</span>
                  <strong>{position.entry.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</strong>
                </div>

                <div>
                  <span>Prix actuel</span>
                  <strong>{price.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</strong>
                </div>

                <div>
                  <span>TP</span>
                  <strong className="greenText">{tpPrice.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</strong>
                </div>

                <div>
                  <span>SL</span>
                  <strong className="redText">{slPrice.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</strong>
                </div>
              </div>

              <div className="actions">
                <button className="ghost" onClick={() => setMargin((value) => Number(value) + 100)}>
                  Ajouter 100€ marge
                </button>

                <button className="danger" onClick={() => closePosition('MANUEL')}>
                  Fermer position
                </button>
              </div>
            </>
          )}
        </section>

        <section className="grid">
          <article className="card videoCard">
            <h2>Vidéos Trading FR</h2>
            <p>À regarder après avoir compris la leçon, pas à la place du cours.</p>

            <iframe
              title={video.title}
              src={`https://www.youtube.com/embed/${video.id}`}
              className="video"
              allowFullScreen
            />

            <div className="videoButtons">
              {VIDEOS.map((item) => (
                <button
                  key={item.id}
                  className={video.id === item.id ? 'activeVideo' : ''}
                  onClick={() => setVideo(item)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.tag}</span>
                </button>
              ))}
            </div>

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Tes notes sur la vidéo..."
            />

            <div className="warning">
              <strong>Important :</strong> ces vidéos complètent la formation, elles ne remplacent pas le cours.
            </div>
          </article>

          <article className="card journal">
            <h2>Journal intelligent</h2>

            {history.length === 0 ? (
              <div className="emptyBox">Aucun trade fermé.</div>
            ) : (
              <div className="historyList">
                {history.map((trade, index) => (
                  <div key={`${trade.closedAt}-${index}`} className="historyItem">
                    <div>
                      <strong>{trade.pair}</strong>
                      <span>{trade.side} · {trade.reason}</span>
                    </div>

                    <strong className={trade.pnl >= 0 ? 'greenText' : 'redText'}>
                      {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)} €
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="card risk">
          <strong>AVERTISSEMENT RISQUE</strong>
          <p>
            Ce simulateur est éducatif. Le trading comporte des risques élevés et ne constitue pas
            un conseil financier.
          </p>
        </section>
      </div>
    </main>
  )
}

export default App
