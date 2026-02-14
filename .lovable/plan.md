
# Package Section Redesign

## Current State
The packages are displayed as a 6-column grid of small square cards. Each card shows only "Pay $X" and "Receive Y USDT".

## New Design

### Layout: Vertical stacked rows (top to bottom, $50 to $5,000)
Each package becomes a full-width horizontal row/card that slides in from left to right with a staggered animation. Each row displays:

- **Pay amount** (e.g., $50)
- **Receive amount** (e.g., 60 USDT)
- **Profit/Bonus** (e.g., +10 USDT)
- **ROI percentage** (e.g., 20% ROI)
- **Buy button** on the right side

### The $1,000 Package - Highlighted
- Visually distinct with a glowing primary border, a "Most Popular" or "Best ROI" badge
- Slightly larger or elevated compared to other rows
- Background tint using the primary color

### Row Animation
- Each row slides in from the left with a staggered delay (50-100ms apart)
- Smooth `translateX` entrance animation

### Responsive Behavior
- On desktop: single horizontal row per package with all details inline
- On mobile: rows stack with details wrapped neatly, still full-width

## Technical Details

### File changed: `src/components/ExpressP2P.tsx`

1. Update the `packages` array to include computed bonus and ROI:
   - Bonus = `usdt - usd`
   - ROI = `((usdt - usd) / usd * 100).toFixed(1)`

2. Replace the 6-column grid with a vertical `flex flex-col gap-3` container (max-width ~700px, centered).

3. Each package row:
   - Horizontal layout using `flex items-center justify-between`
   - Left side: Pay amount, Receive amount, Bonus, ROI badge
   - Right side: "Buy" button
   - Slide-in animation from left (`animate-slide-in-right` reversed or a new `animate-slide-in-left` keyframe)

4. For the $1,000 package:
   - Add a "Most Popular" badge (top-right or inline)
   - Apply `border-primary ring-2 ring-primary/30 bg-primary/5` styling
   - Slightly scale up or add extra padding

### File changed: `src/index.css`
- Add a `slide-in-left` keyframe animation if not already present (animate from `translateX(-30px), opacity 0` to normal)

### No logic changes
- All click handlers, modals, and trade session logic remain exactly the same
