import React, { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
  useReducedMotion
} from "framer-motion"

// 80mm paper, scaled down.
const PAPER_WIDTH = 256
const LINE = 18
const HEIGHTS = {
  title: LINE,
  center: LINE,
  row: LINE,
  rule: LINE,
  total: LINE * 2,
  barcode: 52,
}
const TOOTH = 5
const TOOTH_WIDTH = 8
const LEAD = 14
const STUB = TOOTH + 9
const TAIL = 36
const FEED_SPEED = 360
const BURN_MS = 34
const LEAN = 9
const MAX_TWIST = 9
const GIVE = 10
const TWIST_TEAR = 90
const LIFT_TEAR = 70
const FLICK = 700
const SNAP_BACK = { type: "spring", stiffness: 700, damping: 34 }
const EASE_OUT = [0.23, 1, 0.32, 1]

const PAPER = "oklch(0.985 0.004 95)"
const INK = "oklch(0.26 0 0)"
const SLOT = "oklch(0.16 0 0)"
const SLOT_MIDDLE = 13

function edge(height, tornBottom) {
  const teeth = Math.ceil(PAPER_WIDTH / TOOTH_WIDTH)
  const top = []
  const bottom = []
  for (let i = 0; i <= teeth; i++) {
    const x = Math.min(i * TOOTH_WIDTH, PAPER_WIDTH)
    const up = i % 2 === 1
    top.push(`${x}px ${up ? 0 : TOOTH}px`)
    bottom.unshift(`${x}px ${tornBottom && !up ? height - TOOTH : height}px`)
  }
  return `polygon(${top.join(", ")}, ${bottom.join(", ")})`
}

export function ReceiptPrinter({
  lines,
  total,
  autoPrint = true,
  onTear,
  className = "",
}) {
  const reduceMotion = useReducedMotion()
  const rootRef = useRef(null)
  const inView = useInView(rootRef, { once: true, amount: 0.15 })
  const [phase, setPhase] = useState("idle")
  const [pieces, setPieces] = useState([])
  const pieceKey = useRef(0)
  const running = useRef([])
  const drag = useRef(null)

  const height = TOOTH + LEAD + lines.reduce((sum, l) => sum + HEIGHTS[l.kind], 0) + TAIL

  const fed = useMotionValue(STUB)
  const inside = useTransform(fed, (f) => height - f)
  const shade = useTransform(fed, [STUB, STUB + 24], [0, 1])
  const twist = useMotionValue(0)
  const lift = useMotionValue(0)

  const stop = () => {
    running.current.forEach((a) => a.stop && a.stop())
    running.current = []
  }
  useEffect(() => stop, [])

  const print = () => {
    stop()
    drag.current = null
    twist.jump(0)
    lift.jump(0)
    fed.jump(STUB)
    setPhase("printing")
    if (reduceMotion) {
      fed.jump(height)
      setPhase("printed")
      return
    }
    const values = [STUB]
    const times = [0]
    let position = STUB
    let time = 0
    const feed = (px) => {
      position += px
      time += (px / FEED_SPEED) * 1000
      values.push(position)
      times.push(time)
    }
    const burn = () => {
      time += BURN_MS
      values.push(position)
      times.push(time)
    }
    feed(TOOTH + LEAD - STUB)
    for (const line of lines) {
      burn()
      feed(HEIGHTS[line.kind])
    }
    feed(TAIL)
    
    // animate function signature compatibility check
    const run = animate(fed, values, {
      duration: time / 1000,
      times: times.map((t) => t / time),
      ease: "linear",
    })
    running.current = [run]
    run.then(() => setPhase((p) => (p === "printing" ? "printed" : p)))
  }

  const printRef = useRef(print)
  useEffect(() => {
    printRef.current = print
  })
  useEffect(() => {
    if (autoPrint && inView) printRef.current()
  }, [autoPrint, inView])

  const tear = (vx, vy) => {
    stop()
    drag.current = null
    const piece = {
      key: pieceKey.current++,
      lift: lift.get(),
      twist: twist.get(),
      vx,
      vy,
    }
    flushSync(() => {
      setPhase("torn")
      if (!reduceMotion) setPieces((list) => [...list, piece])
    })
    fed.jump(STUB)
    twist.jump(0)
    lift.jump(0)
    if (navigator.vibrate) navigator.vibrate(10)
    if (onTear) onTear()
  }

  const release = (e) => {
    if (drag.current?.id !== e.pointerId) return
    drag.current = null
    const vx = twist.getVelocity() * 10
    const vy = lift.getVelocity()
    if (Math.abs(vx) > FLICK || vy < -FLICK) return tear(vx, vy)
    running.current = [
      animate(twist, 0, SNAP_BACK),
      animate(lift, 0, SNAP_BACK),
    ]
  }

  const printed = phase === "printed"
  const status = {
    idle: "Paper loaded",
    printing: "Printing",
    printed: "Twist or pull to tear it off",
    torn: "Torn off",
  }[phase]

  return (
    <div
      ref={rootRef}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'min(340px, 100%)' }}
      className={className}
    >
      <div
        style={{ position: 'relative', zIndex: 10, width: '100%', height: height + 8, marginBottom: -SLOT_MIDDLE }}
      >
        <div style={{ position: 'absolute', inset: 0, clipPath: 'inset(-100vh -100vw 0 -100vw)' }}>
          <Paper
            lines={lines}
            height={height}
            inside={inside}
            twist={twist}
            lift={lift}
            label={printed ? `Receipt, total ${total}` : undefined}
            hidden={phase === "idle" || phase === "torn"}
            interactive={printed}
            onPointerDown={(e) => {
              if (!printed || drag.current || e.button !== 0) return
              e.currentTarget.setPointerCapture(e.pointerId)
              stop()
              drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
            }}
            onPointerMove={(e) => {
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
          <motion.span
            aria-hidden
            style={{ 
              opacity: shade, width: PAPER_WIDTH, position: 'absolute', bottom: 0, left: '50%', height: 20, 
              maxWidth: '100%', transform: 'translateX(-50%)', background: 'linear-gradient(to top, rgba(0,0,0,0.15), transparent)', pointerEvents: 'none' 
            }}
          />
        </div>
        <span
          aria-hidden
          style={{ background: SLOT, pointerEvents: 'none', position: 'absolute', top: '100%', left: '50%', height: 5, width: 276, maxWidth: 'calc(100% - 24px)', transform: 'translateX(-50%)', borderBottomLeftRadius: 9999, borderBottomRightRadius: 9999 }}
        />
        {pieces.map((piece) => (
          <TornPiece
            key={piece.key}
            piece={piece}
            lines={lines}
            height={height}
            onGone={() =>
              setPieces((list) => list.filter((p) => p.key !== piece.key))
            }
          />
        ))}
      </div>

      <Printer busy={phase === "printing"} status={status} />

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button onClick={print} className="btn-outline" style={{ background: '#000', color: '#fff' }}>
          {phase === "idle" ? "Print receipt" : "Reprint"}
        </button>
        <button onClick={() => tear(-420, -500)} disabled={!printed} className="btn-outline">
          Tear off
        </button>
      </div>
    </div>
  )
}

const CUTTER =
  "M0 0" +
  Array.from({ length: 33 }, (_, i) => `L${i * 8 + 4} 4L${i * 8 + 8} 0`).join("") +
  "Z"

function Printer({ busy, status }) {
  return (
    <div style={{ position: 'relative', height: 92, width: '100%', borderRadius: 22, background: 'linear-gradient(to bottom, var(--c-white), #f0f0f0)', boxShadow: '0 4px 10px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
      <span aria-hidden style={{ position: 'absolute', bottom: -4, left: 28, height: 6, width: 40, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, background: 'rgba(0,0,0,0.15)' }} />
      <span aria-hidden style={{ position: 'absolute', right: 28, bottom: -4, height: 6, width: 40, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, background: 'rgba(0,0,0,0.15)' }} />
      <span
        aria-hidden
        style={{ position: 'absolute', left: 16, right: 16, top: 34, height: 1, background: 'rgba(0,0,0,0.1)', boxShadow: '0 1px 0 rgba(255,255,255,0.7)' }}
      />
      <div
        aria-hidden
        style={{ background: SLOT, position: 'absolute', top: 8, left: '50%', height: 10, width: 276, maxWidth: 'calc(100% - 24px)', transform: 'translateX(-50%)', borderRadius: 9999 }}
      />
      <svg
        aria-hidden
        viewBox="0 0 264 4"
        preserveAspectRatio="none"
        style={{ position: 'absolute', top: 17, left: '50%', height: 4, width: 264, maxWidth: 'calc(100% - 36px)', transform: 'translateX(-50%)', color: 'rgba(0,0,0,0.35)' }}
      >
        <path fill="currentColor" d={CUTTER} />
      </svg>
      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#666', margin: 0 }} aria-live="polite">
          {status}
        </p>
        <span aria-hidden style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.12em', color: '#666', textTransform: 'uppercase' }}>
          {busy ? "Busy" : "Ready"}
          <span
            style={{
              width: 8, height: 8, borderRadius: '50%', transition: 'background-color 150ms ease-out, box-shadow 150ms ease-out',
              background: busy ? "oklch(0.8 0.16 75)" : "oklch(0.74 0.17 150)",
              boxShadow: busy
                ? "0 0 6px oklch(0.8 0.16 75 / 0.7)"
                : "0 0 6px oklch(0.74 0.17 150 / 0.6)",
              animation: busy ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
            }}
          />
        </span>
      </div>
    </div>
  )
}

function Paper({
  lines,
  height,
  inside,
  twist,
  lift,
  x,
  opacity,
  label,
  hidden,
  interactive,
  torn = false,
  ...handlers
}) {
  const y = useTransform(() => inside.get() + lift.get())
  return (
    <motion.div
      role={label ? "region" : undefined}
      aria-label={label}
      aria-hidden={hidden || !label || undefined}
      style={{
        x,
        y,
        rotate: twist,
        rotateX: LEAN,
        transformPerspective: 900,
        opacity,
        width: PAPER_WIDTH,
        height,
        marginLeft: -PAPER_WIDTH / 2,
        position: 'absolute', bottom: 0, left: '50%', maxWidth: '100%', transformOrigin: 'bottom', userSelect: 'none',
        filter: 'drop-shadow(0 0 0.5px rgba(0,0,0,0.2)) drop-shadow(0 6px 10px rgba(0,0,0,0.1))',
        cursor: interactive ? 'grab' : 'default',
        touchAction: interactive ? 'none' : 'auto',
        pointerEvents: interactive ? 'auto' : 'none'
      }}
      {...handlers}
    >
      <div
        style={{
          clipPath: edge(height, torn),
          background: PAPER,
          color: INK,
          paddingTop: TOOTH + LEAD,
          height: '100%',
          paddingLeft: 16,
          paddingRight: 16,
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: '18px',
          textTransform: 'uppercase',
          boxSizing: 'border-box'
        }}
      >
        {lines.map((line, i) => (
          <Line key={i} line={line} />
        ))}
      </div>
    </motion.div>
  )
}

function Line({ line }) {
  switch (line.kind) {
    case "rule":
      return (
        <p aria-hidden style={{ height: 18, overflow: 'hidden', whiteSpace: 'nowrap', opacity: 0.7, margin: 0 }}>
          {(line.char ?? "-").repeat(48)}
        </p>
      )
    case "row":
      return (
        <p style={{ display: 'flex', height: 18, justifyContent: 'space-between', gap: 12, fontVariantNumeric: 'tabular-nums', margin: 0 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'pre' }}>
            {line.left}
          </span>
          <span>{line.right}</span>
        </p>
      )
    case "total":
      return (
        <p style={{ display: 'flex', height: 36, alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, fontWeight: 'bold', fontVariantNumeric: 'tabular-nums', margin: 0 }}>
          <span style={{ display: 'inline-block', transformOrigin: 'top', transform: 'scaleY(2)' }}>{line.left}</span>
          <span style={{ display: 'inline-block', transformOrigin: 'top', transform: 'scaleY(2)' }}>{line.right}</span>
        </p>
      )
    case "barcode":
      return (
        <div style={{ display: 'flex', height: 52, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Barcode code={line.code} />
          <span style={{ fontSize: 12, letterSpacing: '0.3em' }}>{line.code}</span>
        </div>
      )
    default:
      return (
        <p style={{ height: 18, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', fontWeight: line.kind === "title" ? 'bold' : 'normal', letterSpacing: line.kind === "title" ? '0.2em' : 'normal', margin: 0 }}>
          {line.text}
        </p>
      )
  }
}

function Barcode({ code }) {
  let seed = [...code].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7)
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  const bars = []
  for (let x = 0; x < 150; ) {
    const w = 1 + Math.floor(next() * 3)
    bars.push({ x, w })
    x += w + 1 + Math.floor(next() * 3)
  }
  return (
    <svg aria-hidden viewBox="0 0 152 28" style={{ height: 28, width: 152, fill: 'currentColor' }}>
      {bars.map((b) => (
        <rect key={b.x} x={b.x} width={b.w} height={28} />
      ))}
    </svg>
  )
}

function TornPiece({ piece, lines, height, onGone }) {
  const inside = useMotionValue(0)
  const x = useMotionValue(0)
  const lift = useMotionValue(piece.lift)
  const twist = useMotionValue(piece.twist)
  const opacity = useMotionValue(1)
  const gone = useRef(onGone)

  useEffect(() => { gone.current = onGone })

  useEffect(() => {
    const direction = Math.sign(piece.vx) || -1
    const all = [
      animate(x, piece.vx * 0.25, { type: "spring", stiffness: 90, damping: 18, velocity: piece.vx }),
      animate(lift, piece.lift - 90, { type: "spring", stiffness: 90, damping: 18, velocity: piece.vy }),
      animate(twist, piece.twist + direction * 8, { duration: 0.5, ease: EASE_OUT }),
      animate(opacity, 0, { duration: 0.26, delay: 0.14, ease: EASE_OUT }),
    ]
    all[3].then(() => gone.current())
    return () => all.forEach((a) => a.stop && a.stop())
  }, [piece, x, lift, twist, opacity])

  return (
    <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0 }}>
      <Paper lines={lines} height={height} inside={inside} x={x} twist={twist} lift={lift} opacity={opacity} hidden torn />
    </div>
  )
}
