

## Redesign and Reposition Crypto Calculator

### What Changes

1. **Move Calculator above P2P section** in `src/pages/Index.tsx` -- place `<CryptoCalculator />` between `<TrustIndicators />` and the P2P tab toggle section, instead of after it.

2. **Redesign CryptoCalculator for a fintech look** in `src/components/CryptoCalculator.tsx`:
   - Replace the basic input box with a polished two-panel conversion layout (You Pay on left, You Receive on right, connected by an arrow)
   - Use a sleek card with subtle gradient border instead of generic glass-card
   - Add a currency label badge ("USD") next to the input and ("USDT") next to the output for clarity
   - Use a slider alongside quick-amount chips so users can visually drag between $50-$25,000
   - Show the profit percentage as a highlighted green pill badge inline with the result
   - Style the Buy button with the existing `glow` variant for consistency
   - Format all amounts with proper comma separators (e.g. `12,200.00 USDT`)
   - Keep all existing trade logic (confirmation modal, conflict modal, session handling) completely intact

### Technical Details

**File: `src/pages/Index.tsx`**
- Move `<CryptoCalculator />` from after the P2P section to before it (between TrustIndicators and the `#rates` section)

**File: `src/components/CryptoCalculator.tsx`**
- Redesign the JSX layout to a horizontal two-column conversion card on desktop, stacking vertically on mobile
- Import and use `Slider` from `@/components/ui/slider` for the amount range selector
- Add currency badges (USD / USDT) using existing `Badge` component
- Apply comma formatting via `toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`
- Keep the same `calculateUsdtReceived` function, same min/max constants, same trade session logic -- zero functional changes

