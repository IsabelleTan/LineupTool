import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Game } from '@/api/games'
import type { LineupSlotRead } from '@/api/lineups'
import type { Player } from '@/api/players'
import { formatDate } from '@/lib/utils'

interface Props {
  game: Game
  slots: LineupSlotRead[]
  players: Player[]
  availablePlayers: Player[]
}

const TOTAL_BATTING_SLOTS = 10

const cell: React.CSSProperties = {
  border: '1px solid #555',
  padding: '1px 3px',
  verticalAlign: 'middle',
}

const hCell: React.CSSProperties = {
  ...cell,
  backgroundColor: '#ddd',
  fontWeight: 'bold',
  textAlign: 'center',
  fontSize: '8pt',
  padding: '2px 3px',
}

const ROW_H = '20px'

export default function LineupPrintView({ game, slots, players, availablePlayers }: Props) {
  const ordered = [...slots].sort((a, b) => a.batting_order - b.batting_order)
  const assignedIds = new Set(slots.map((s) => s.player_id))
  const bench = availablePlayers.filter((p) => !assignedIds.has(p.id))
  const licensedBench = bench.filter((p) => p.license_number)
  const unlicensedBench = bench.filter((p) => !p.license_number)

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `@media print {
      #root { display: none !important; }
      .lineup-print-sheet { display: block !important; }
      @page { size: A4 portrait; margin: 10mm; }
    }`
    document.head.appendChild(style)
    return () => style.remove()
  }, [])

  function findPlayer(id: number) {
    return players.find((p) => p.id === id)
  }

  const homeTeam = game.is_home ? 'Challengers' : game.opponent
  const guestTeam = game.is_home ? game.opponent : 'Challengers'

  // 10 display rows: first 9 from actual slots, slot 10 reserved for Flex
  const displaySlots = Array.from({ length: TOTAL_BATTING_SLOTS }, (_, i) => {
    const isFlex = i === TOTAL_BATTING_SLOTS - 1
    const slot = isFlex ? null : (ordered[i] ?? null)
    const player = slot ? findPlayer(slot.player_id) : null
    return { index: i, slot, player, isFlex }
  })

  // Blank rows to pad right-side bench tables so they don't look sparse
  const licensedBlanks = Math.max(0, 5 - licensedBench.length)
  const unlicensedBlanks = Math.max(0, 4 - unlicensedBench.length)

  return createPortal(
    <div
      className="lineup-print-sheet"
      style={{
        display: 'none',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '9pt',
        color: '#000',
        lineHeight: 1.2,
        paddingRight: '2px',
      }}
    >
      {/* ── SBSF Header ── */}
      <div style={{ marginBottom: '6px' }}>
        <img src="/sbsf-lineup-header.jpg" alt="Swiss Baseball and Softball Federation" style={{ width: '100%', display: 'block' }} />
        <div style={{ fontSize: '18pt', fontWeight: 'bold', letterSpacing: '6px', textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '4px', marginTop: '4px' }}>
          LINEUP
        </div>
      </div>

      {/* ── Game info ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5px', fontSize: '9pt' }}>
        <tbody>
          <tr>
            <td style={{ ...hCell, width: '12%' }}>HOME</td>
            <td style={{ ...cell, width: '38%' }}>{homeTeam}</td>
            <td style={{ ...hCell, width: '12%' }}>DATE</td>
            <td style={{ ...cell, width: '38%' }}>{formatDate(game.game_date)}</td>
          </tr>
          <tr>
            <td style={hCell}>GUEST</td>
            <td style={cell}>{guestTeam}</td>
            <td style={hCell}>PLACE</td>
            <td style={cell} />
          </tr>
          <tr>
            <td style={hCell} />
            <td style={cell} />
            <td style={hCell}>GROUND</td>
            <td style={cell} />
          </tr>
          <tr>
            <td style={hCell} />
            <td style={cell} />
            <td style={hCell}>SPIELNUMMER</td>
            <td style={cell} />
          </tr>
        </tbody>
      </table>

      {/* ── Main sheet: batting order (left) + bench (right) ── */}
      {/* Outer table keeps columns within the print area; flex overflows with gap */}
      <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
        <colgroup>
          <col style={{ width: '62%' }} />
          <col style={{ width: '6px' }} />
          <col />
        </colgroup>
        <tbody>
          <tr style={{ verticalAlign: 'top' }}>

            {/* Left: batting order table */}
            <td style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: '1px solid #555', fontSize: '9pt' }}>
            <colgroup>
              <col style={{ width: '6%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '42%' }} />
              <col style={{ width: '20%' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={hCell}>#</th>
                <th style={hCell}>LIZENZ</th>
                <th style={hCell}>Sp.Nr.</th>
                <th style={hCell}>NAME</th>
                <th style={hCell}>Pos.</th>
              </tr>
            </thead>
            <tbody>
              {displaySlots.map(({ index, slot, player, isFlex }) => (
                <React.Fragment key={index}>
                  {/* Row 1: player data */}
                  <tr>
                    <td
                      rowSpan={3}
                      style={{
                        ...cell,
                        textAlign: 'center',
                        fontWeight: 'bold',
                        verticalAlign: 'middle',
                        backgroundColor: isFlex ? '#f0f0f0' : undefined,
                        fontSize: isFlex ? '7pt' : '9pt',
                        lineHeight: 1.1,
                      }}
                    >
                      {isFlex ? 'Flex' : `${index + 1}.`}
                    </td>
                    <td style={{ ...cell, height: ROW_H, overflow: 'hidden' }}>
                      {!isFlex ? (player?.license_number ?? '') : ''}
                    </td>
                    <td style={{ ...cell, height: ROW_H, textAlign: 'center', overflow: 'hidden' }}>
                      {!isFlex ? (player?.jersey_number ?? '') : ''}
                    </td>
                    <td style={{ ...cell, height: ROW_H, overflow: 'hidden' }}>
                      {!isFlex ? (player?.name ?? '') : ''}
                    </td>
                    <td style={{ ...cell, height: ROW_H, textAlign: 'center', overflow: 'hidden' }}>
                      {!isFlex ? (slot?.fielding_position ?? '') : ''}
                    </td>
                  </tr>
                  {/* Rows 2–3: blank for substitutions */}
                  <tr>
                    <td style={{ ...cell, height: ROW_H }} />
                    <td style={{ ...cell, height: ROW_H }} />
                    <td style={{ ...cell, height: ROW_H }} />
                    <td style={{ ...cell, height: ROW_H }} />
                  </tr>
                  <tr>
                    <td style={{ ...cell, height: ROW_H }} />
                    <td style={{ ...cell, height: ROW_H }} />
                    <td style={{ ...cell, height: ROW_H }} />
                    <td style={{ ...cell, height: ROW_H }} />
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
            </td>

            {/* gap column */}
            <td />

            {/* Right: bench tables — paddingRight keeps right border off the page margin edge */}
            <td style={{ padding: 0, paddingRight: '2px' }}>
          {/* Licensed bench players */}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: '1px solid #555', fontSize: '9pt', marginBottom: '4px' }}>
            <colgroup>
              <col style={{ width: '42%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '44%' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={hCell}>LIZENZ</th>
                <th style={hCell}>Nr.</th>
                <th style={hCell}>NAME</th>
              </tr>
            </thead>
            <tbody>
              {licensedBench.map((p) => (
                <tr key={p.id}>
                  <td style={{ ...cell, height: ROW_H }}>{p.license_number}</td>
                  <td style={{ ...cell, textAlign: 'center' }}>{p.jersey_number ?? ''}</td>
                  <td style={cell}>{p.name}</td>
                </tr>
              ))}
              {Array.from({ length: licensedBlanks }).map((_, i) => (
                <tr key={`lb-${i}`}>
                  <td style={{ ...cell, height: ROW_H }} />
                  <td style={cell} />
                  <td style={cell} />
                </tr>
              ))}
            </tbody>
          </table>

          {/* Unlicensed players */}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: '1px solid #555', fontSize: '9pt' }}>
            <colgroup>
              <col style={{ width: '14%' }} />
              <col style={{ width: '86%' }} />
            </colgroup>
            <thead>
              <tr>
                <th colSpan={2} style={{ ...hCell, textAlign: 'left', padding: '2px 4px' }}>
                  SPIELER OHNE LIZENZ
                </th>
              </tr>
              <tr>
                <th style={hCell}>Nr.</th>
                <th style={{ ...hCell, textAlign: 'left' }}>NAME</th>
              </tr>
            </thead>
            <tbody>
              {unlicensedBench.map((p) => (
                <tr key={p.id}>
                  <td style={{ ...cell, height: ROW_H, textAlign: 'center' }}>{p.jersey_number ?? ''}</td>
                  <td style={cell}>{p.name}</td>
                </tr>
              ))}
              {Array.from({ length: unlicensedBlanks }).map((_, i) => (
                <tr key={`ub-${i}`}>
                  <td style={{ ...cell, height: ROW_H }} />
                  <td style={cell} />
                </tr>
              ))}
            </tbody>
          </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Signatures ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
        <div style={{ width: '45%' }}>
          <div style={{ fontSize: '8pt', marginBottom: '3px' }}>Unterschrift Manager</div>
          <div style={{ borderBottom: '1px solid #333', height: '18px' }} />
        </div>
        <div style={{ width: '45%' }}>
          <div style={{ fontSize: '8pt', marginBottom: '3px' }}>Unterschrift Umpire</div>
          <div style={{ borderBottom: '1px solid #333', height: '18px' }} />
        </div>
      </div>
    </div>,
    document.body,
  )
}
