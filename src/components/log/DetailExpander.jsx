import { useState } from 'react';
import { C, F } from '../../tokens.js';
import { Input } from '../ui/Input.jsx';
import { ALL_CATEGORIES as CATEGORIES } from '../../lib/aggregates.js';

export function DetailExpander({ note, onNoteChange, category, onCategoryChange, direction, onDirectionChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: '1rem' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'none',
          border: 'none',
          fontFamily: F.sans,
          fontSize: '0.85rem',
          color: C.slate,
          textDecoration: 'underline',
        }}
      >
        {open ? 'Hide detail' : 'Add detail'}
      </button>

      {open && (
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {['expense', 'income'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDirectionChange(d)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: `1px solid ${direction === d ? C.sage : C.line}`,
                  background: direction === d ? C.sage : C.paper,
                  color: direction === d ? C.paper : C.ink,
                  fontFamily: F.sans,
                  fontSize: '0.85rem',
                  textTransform: 'capitalize',
                }}
              >
                {d}
              </button>
            ))}
          </div>

          <label style={{ display: 'block', marginBottom: '1rem' }}>
            <span className="label" style={{ display: 'block', marginBottom: '0.4rem' }}>Category</span>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              style={{
                width: '100%',
                fontFamily: F.sans,
                fontSize: '1rem',
                padding: '0.75rem 0.9rem',
                borderRadius: '10px',
                border: `1px solid ${C.line}`,
                background: C.paper,
                color: C.ink,
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace('_', ' ')}</option>
              ))}
            </select>
          </label>

          <Input label="Note (optional)" value={note} onChange={(e) => onNoteChange(e.target.value)} placeholder="What was this for?" />
        </div>
      )}
    </div>
  );
}
