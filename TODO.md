# TODO: Fix Investment Section Resumé Button Responsiveness

## Task
Make the "Résumé" button in the investment section fully responsive across all screen sizes.

## Status
- [x] Planning complete
- [x] index.html updated
- [x] Style.css updated
- [ ] Testing complete

---

# TODO: Add Smooth Graph Animation to Time Analysis Chart

## Task
Add smooth formation animation to the "Analyse Temporelle" line chart.

## Features to Implement

### Animation Effects:
1. **Progressive line drawing** - Lines animate from left to right
2. **Point-by-point reveal** - Data points appear as line reaches them
3. **Animated grid** - Grid lines fade in progressively
4. **Legend animation** - Legend slides up smoothly
5. **Smooth easing** - Fluid 60fps animation

## Changes Required

### 1. Script.js - Rewrite updateTimeChart()
- [ ] Add animation loop using `requestAnimationFrame`
- [ ] Implement stroke-dashoffset technique for line drawing
- [ ] Add point-by-point reveal animation
- [ ] Add grid fade-in animation

### 2. Style.css - Add Chart Animations
- [ ] Add `@keyframes` for chart elements
- [ ] Add smooth transitions for chart container
- [ ] Add loading state animation

## Implementation Details

### Step 1: Add CSS Animations
```css
/* Chart line animation */
@keyframes drawLine {
    from {
        stroke-dashoffset: 1000;
    }
    to {
        stroke-dashoffset: 0;
    }
}

.chart-line-animated {
    animation: drawLine 1.5s ease-out forwards;
}

/* Point animation */
@keyframes pointReveal {
    from {
        transform: scale(0);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}

.chart-point-animated {
    animation: pointReveal 0.3s ease-out forwards;
}
```

### Step 2: Rewrite updateTimeChart() with Animation
```javascript
function updateTimeChart() {
    // ... existing data preparation code ...

    // Draw with animation
    animateChart(periodData, maxValue, periods);
}

function animateChart(periodData, maxValue, periods) {
    // Animation using requestAnimationFrame and stroke-dashoffset
}
```

## Verification
- [ ] Test animation smoothness on desktop
- [ ] Verify animation works on mobile
- [ ] Check dark mode compatibility
- [ ] Test with different time filters (7, 30, 365 days)
- [ ] Verify performance on low-end devices

## Status
- [x] Planning complete
- [ ] Script.js updated (updateTimeChart with animation)
- [ ] Style.css updated (chart animations)
- [ ] Testing complete

