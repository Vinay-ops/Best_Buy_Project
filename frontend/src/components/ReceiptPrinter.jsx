import React, { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { animate, motion, useInView, useMotionValue, useTransform, useReducedMotion } from "framer-motion"

// ── CONSTANTS ──────────────────────────────────────────────────────────────
const PAPER_WIDTH = 320      // wider so text doesn't truncate
const LINE = 18
const HEIGHTS = {
  title: LINE, center: LINE, row: LINE, rule: LINE,
  total: LINE * 2, barcode: 56,
}
const TOOTH = 5
const TOOTH_WIDTH = 8
const LEAD = 14
const STUB = TOOTH + 9
const TAIL = 36
const FEED_SPEED = 360
const BURN_MS = 34
const LEAN = 6
const MAX_TWIST = 9
const GIVE = 10
const TWIST_TEAR = 90
const LIFT_TEAR = 70
const FLICK = 700
const SNAP_BACK = { type: "spring", stiffness: 700, damping: 34 }
const EASE_OUT = [0.23, 1, 0.32, 1]

const PAPER = "oklch(0.985 0.004 95)"
const INK = "oklch(0.22 0 0)"
const SLOT = "oklch(0.16 0 0)"
const SLOT_MIDDLE = 13

function edge(height, tornBottom) {
  const teeth = Math.ceil(PAPER_WIDTH / TOOTH_WIDTH)
  const top = [], bottom = []
  for (let i = 0; i <= teeth; i++) {
    const x = Math.min(i * TOOTH_WIDTH, PAPER_WIDTH)
    const up = i % 2 === 1
    top.push(`${x}px ${up ? 0 : TOOTH}px`)
    bottom.unshift(`${x}px ${tornBottom && !up ? height - TOOTH : height}px`)
  }
  return `polygon(${top.join(", ")}, ${bottom.join(", ")})`
}

const CUTTER = "M0 0" +
  Array.from({ length: Math.ceil(PAPER_WIDTH / 8) }, (_, i) =>
    `L${i * 8 + 4} 4L${i * 8 + 8} 0`
  ).join("") + "Z"

// ── LINE RENDERER ───────────────────────────────────────────────────────────
function Line({ line }) {
  const baseStyle = {
    fontFamily: "'Space Mono', 'Courier New', monospace",
    fontSize: 12,
    lineHeight: '18px',
    textTransform: 'uppercase',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  switch (line.kind) {
    case "rule":
      return <p style={{ ...baseStyle, opacity: 0.5 }}>{(line.char ?? "-").repeat(44)}</p>

    case "row":
      return (
        <p style={{ ...baseStyle, display: 'flex', justifyContent: 'space-between', gap: 8, whiteSpace: 'normal' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{line.left}</span>
          <span style={{ flexShrink: 0 }}>{line.right}</span>
        </p>
      )

    case "total":
      return (
        <p style={{ ...baseStyle, display: 'flex', justifyContent: 'space-between', gap: 8, height: 36, alignItems: 'flex-start', fontWeight: 'bold', whiteSpace: 'normal' }}>
          <span style={{ display: 'inline-block', transformOrigin: 'top', transform: 'scaleY(2)' }}>{line.left}</span>
          <span style={{ display: 'inline-block', transformOrigin: 'top', transform: 'scaleY(2)', flexShrink: 0 }}>{line.right}</span>
        </p>
      )

    case "barcode":
      return (
        <div style={{ display: 'flex', height: 56, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
          <Barcode code={line.code} />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '0.2em' }}>{line.code}</span>
        </div>
      )

    default: // title & center
      return (
        <p style={{ ...baseStyle, textAlign: 'center', fontWeight: line.kind === 'title' ? 'bold' : 'normal', letterSpacing: line.kind === 'title' ? '0.15em' : 'normal' }}>
          {line.text}
        </p>
      )
  }
}

function Barcode({ code }) {
  let seed = [...code].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7)
  const next = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  const bars = []
  for (let x = 0; x < 210; ) {
    const w = 1 + Math.floor(next() * 3)
    bars.push({ x, w })
    x += w + 1 + Math.floor(next() * 2)
  }
  return (
    <svg viewBox="0 0 212 28" style={{ height: 28, width: 212, fill: 'currentColor' }}>
      {bars.map(b => <rect key={b.x} x={b.x} width={b.w} height={28} />)}
    </svg>
  )
}

// ── PAPER STRIP ─────────────────────────────────────────────────────────────
function Paper({ lines, height, inside, twist, lift, x, opacity, hidden, interactive, torn = false, ...handlers }) {
  const y = useTransform(() => inside.get() + lift.get())
  return (
    <motion.div
      aria-hidden={hidden || undefined}
      style={{
        x, y, rotate: twist, rotateX: LEAN, transformPerspective: 900, opacity,
        width: PAPER_WIDTH, height, marginLeft: -PAPER_WIDTH / 2,
        position: 'absolute', bottom: 0, left: '50%', maxWidth: '100%', transformOrigin: 'bottom',
        userSelect: 'none',
        filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.15)) drop-shadow(0 8px 16px rgba(0,0,0,0.25))',
        cursor: interactive ? 'grab' : 'default',
        touchAction: interactive ? 'none' : 'auto',
        pointerEvents: interactive ? 'auto' : 'none',
      }}
      {...handlers}
    >
      <div style={{
        clipPath: edge(height, torn), background: PAPER, color: INK,
        paddingTop: TOOTH + LEAD, paddingLeft: 16, paddingRight: 16, height: '100%', boxSizing: 'border-box'
      }}>
        {lines.map((line, i) => <Line key={i} line={line} />)}
      </div>
    </motion.div>
  )
}

// ── TORN PIECE ──────────────────────────────────────────────────────────────
function TornPiece({ piece, lines, height, onGone }) {
  const inside = useMotionValue(0)
  const x = useMotionValue(0)
  const lift = useMotionValue(piece.lift)
  const twist = useMotionValue(piece.twist)
  const opacity = useMotionValue(1)
  const goneRef = useRef(onGone)
  useEffect(() => { goneRef.current = onGone })

  useEffect(() => {
    const dir = Math.sign(piece.vx) || -1
    const controls = [
      animate(x, piece.vx * 0.25, { type: "spring", stiffness: 90, damping: 18, velocity: piece.vx }),
      animate(lift, piece.lift - 90, { type: "spring", stiffness: 90, damping: 18, velocity: piece.vy }),
      animate(twist, piece.twist + dir * 8, { duration: 0.5, ease: EASE_OUT }),
      animate(opacity, 0, { duration: 0.28, delay: 0.12, ease: EASE_OUT }),
    ]
    const timer = setTimeout(() => goneRef.current(), 600)
    return () => { controls.forEach(a => a.stop?.()); clearTimeout(timer) }
  }, [])

  return (
    <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0 }}>
      <Paper lines={lines} height={height} inside={inside} x={x} twist={twist} lift={lift} opacity={opacity} hidden torn />
    </div>
  )
}

// ── PRINTER BODY ─────────────────────────────────────────────────────────────
function PrinterBody({ busy, status }) {
  const cutterTeeth = Math.ceil((PAPER_WIDTH + 20) / 8)
  const cutter = "M0 0" + Array.from({ length: cutterTeeth }, (_, i) => `L${i * 8 + 4} 4L${i * 8 + 8} 0`).join("") + "Z"

  return (
    <div style={{
      position: 'relative', height: 90, width: '100%', maxWidth: PAPER_WIDTH + 60,
      borderRadius: 20, background: 'linear-gradient(to bottom, #f0f0f0, #e4e4e4)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.7)'
    }}>
      {/* Feet */}
      <span style={{ position: 'absolute', bottom: -4, left: 28, height: 5, width: 40, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, background: 'rgba(0,0,0,0.12)' }} />
      <span style={{ position: 'absolute', right: 28, bottom: -4, height: 5, width: 40, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, background: 'rgba(0,0,0,0.12)' }} />
      {/* Cover seam */}
      <span style={{ position: 'absolute', left: 16, right: 16, top: 32, height: 1, background: 'rgba(0,0,0,0.08)', boxShadow: '0 1px 0 rgba(255,255,255,0.6)' }} />
      {/* Slot */}
      <div style={{ background: SLOT, position: 'absolute', top: 8, left: '50%', height: 10, width: PAPER_WIDTH + 20, maxWidth: 'calc(100% - 24px)', transform: 'translateX(-50%)', borderRadius: 9999 }} />
      {/* Cutter teeth */}
      <svg viewBox={`0 0 ${cutterTeeth * 8} 4`} preserveAspectRatio="none" style={{ position: 'absolute', top: 17, left: '50%', height: 4, width: PAPER_WIDTH + 20, maxWidth: 'calc(100% - 36px)', transform: 'translateX(-50%)', color: 'rgba(0,0,0,0.3)' }}>
        <path fill="currentColor" d={cutter} />
      </svg>
      {/* Status bar */}
      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8125rem', color: '#555', margin: 0, flex: 1, minWidth: 0 }}>
          {status}
        </p>
        <span style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 6, fontSize: '0.6875rem', fontWeight: 600, color: '#777', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
          {busy ? "Busy" : "Ready"}
          <span style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: busy ? "oklch(0.8 0.16 75)" : "oklch(0.74 0.17 150)",
            boxShadow: busy ? "0 0 6px oklch(0.8 0.16 75 / 0.7)" : "0 0 6px oklch(0.74 0.17 150 / 0.6)",
            animation: busy ? 'bbf-pulse 1.2s ease-in-out infinite' : 'none'
          }} />
        </span>
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function ReceiptPrinter({ lines, total, autoPrint = true, onTear, className = "" }) {
  const reduceMotion = useReducedMotion()
  const rootRef = useRef(null)
  const inView = useInView(rootRef, { once: true, amount: 0.1 })
  const [phase, setPhase] = useState("idle")
  const [pieces, setPieces] = useState([])
  const pieceKey = useRef(0)
  const running = useRef([])
  const drag = useRef(null)

  const height = TOOTH + LEAD + lines.reduce((s, l) => s + HEIGHTS[l.kind], 0) + TAIL

  const fed = useMotionValue(STUB)
  const inside = useTransform(fed, f => height - f)
  const shade = useTransform(fed, [STUB, STUB + 24], [0, 1])
  const twist = useMotionValue(0)
  const lift = useMotionValue(0)

  const stopAll = () => { running.current.forEach(a => a.stop?.()); running.current = [] }
  useEffect(() => stopAll, [])

  // ── Print ─────────────────────────────────────────────────────────────────
  const print = () => {
    stopAll()
    drag.current = null
    twist.jump(0)
    lift.jump(0)
    fed.jump(STUB)
    setPhase("printing")
    setPieces([])

    if (reduceMotion) {
      fed.jump(height)
      setPhase("printed")
      return
    }

    // Build keyframe arrays
    const values = [STUB], times = [0]
    let pos = STUB, t = 0
    const feed = px => { pos += px; t += (px / FEED_SPEED) * 1000; values.push(pos); times.push(t) }
    const burn = () => { t += BURN_MS; values.push(pos); times.push(t) }

    feed(TOOTH + LEAD - STUB)
    for (const line of lines) { burn(); feed(HEIGHTS[line.kind]) }
    feed(TAIL)

    const totalTime = t
    const run = animate(fed, values, {
      duration: totalTime / 1000,
      times: times.map(x => x / totalTime),
      ease: "linear",
      onComplete: () => setPhase(p => p === "printing" ? "printed" : p),
    })
    running.current = [run]
  }

  const printRef = useRef(print)
  useEffect(() => { printRef.current = print })
  useEffect(() => { if (autoPrint && inView) printRef.current() }, [autoPrint, inView])

  // ── Tear ──────────────────────────────────────────────────────────────────
  const tear = (vx, vy) => {
    stopAll()
    drag.current = null
    const piece = { key: pieceKey.current++, lift: lift.get(), twist: twist.get(), vx, vy }
    flushSync(() => {
      setPhase("torn")
      if (!reduceMotion) setPieces(prev => [...prev, piece])
    })
    fed.jump(STUB)
    twist.jump(0)
    lift.jump(0)
    if (navigator.vibrate) navigator.vibrate(12)
    if (onTear) onTear()
  }

  const release = e => {
    if (drag.current?.id !== e.pointerId) return
    drag.current = null
    const vx = twist.getVelocity() * 10
    const vy = lift.getVelocity()
    if (Math.abs(vx) > FLICK || vy < -FLICK) { tear(vx, vy); return }
    running.current = [animate(twist, 0, SNAP_BACK), animate(lift, 0, SNAP_BACK)]
  }

  const printed = phase === "printed"
  const status = { idle: "Paper loaded", printing: "Printing...", printed: "Twist or pull to tear", torn: "Torn off" }[phase]

  return (
    <>
      <style>{`
        @keyframes bbf-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div ref={rootRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: `min(${PAPER_WIDTH + 80}px, 100%)` }} className={className}>
        {/* Paper emergence area */}
        <div style={{ position: 'relative', zIndex: 10, width: '100%', height: height + 8, marginBottom: -SLOT_MIDDLE }}>
          <div style={{ position: 'absolute', inset: 0, clipPath: 'inset(-200px -200px 0 -200px)' }}>
            <Paper
              lines={lines} height={height} inside={inside} twist={twist} lift={lift}
              hidden={phase === "idle" || phase === "torn"} interactive={printed}
              onPointerDown={e => {
                if (!printed || drag.current || e.button !== 0) return
                e.currentTarget.setPointerCapture(e.pointerId)
                stopAll()
                drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
              }}
              onPointerMove={e => {
                const d = drag.current
                if (!d || d.id !== e.pointerId) return
                const dx = e.clientX - d.x
                const up = d.y - e.clientY
                twist.set(MAX_TWIST * Math.tanh(dx / 150))
                lift.set(-GIVE * Math.tanh(Math.max(up, 0) / (GIVE * 4)))
                if (Math.abs(dx) > TWIST_TEAR || up > LIFT_TEAR) {
                  tear(Math.sign(dx) * 500, up > LIFT_TEAR ? -600 : -200)
                }
              }}
              onPointerUp={release}
              onPointerCancel={release}
            />
            {/* Slot shadow */}
            <motion.span style={{
              opacity: shade, width: PAPER_WIDTH, position: 'absolute', bottom: 0, left: '50%',
              height: 24, maxWidth: '100%', transform: 'translateX(-50%)',
              background: 'linear-gradient(to top, rgba(0,0,0,0.18), transparent)',
              pointerEvents: 'none'
            }} />
          </div>
          {/* Slot front lip */}
          <span style={{
            background: SLOT, pointerEvents: 'none', position: 'absolute', top: '100%',
            left: '50%', height: 5, width: PAPER_WIDTH + 20, maxWidth: 'calc(100% - 24px)',
            transform: 'translateX(-50%)', borderBottomLeftRadius: 9999, borderBottomRightRadius: 9999
          }} />
          {pieces.map(piece => (
            <TornPiece key={piece.key} piece={piece} lines={lines} height={height}
              onGone={() => setPieces(prev => prev.filter(p => p.key !== piece.key))}
            />
          ))}
        </div>

        {/* Printer body */}
        <PrinterBody busy={phase === "printing"} status={status} />

        {/* Buttons */}
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button
            onClick={() => printRef.current()}
            style={{
              height: 40, padding: '0 20px', borderRadius: 20, background: '#fff', color: '#000',
              fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              border: 'none', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s'
            }}
            onMouseEnter={e => { e.target.style.transform = 'scale(1.04)'; e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)' }}
            onMouseLeave={e => { e.target.style.transform = ''; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)' }}
          >
            {phase === "idle" ? "Print receipt" : "Reprint"}
          </button>
          <button
            onClick={() => tear(-420, -500)}
            disabled={!printed}
            style={{
              height: 40, padding: '0 20px', borderRadius: 20, background: printed ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
              color: printed ? '#fff' : 'rgba(255,255,255,0.3)', fontWeight: 600, fontSize: '0.875rem',
              border: '1px solid ' + (printed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'),
              cursor: printed ? 'pointer' : 'not-allowed', transition: 'all 0.15s'
            }}
          >
            Tear off
          </button>
        </div>
      </div>
    </>
  )
}
