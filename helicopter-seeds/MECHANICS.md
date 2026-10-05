# Helicopter Seeds — mechanics reference

Maintenance map for humans and coding agents. Describes the **current public source** in this directory. See [tutor guide](../site/tutors.html) for pedagogy and scientific caveats.

## Code map

- [`src/simulation.js`](src/simulation.js): pure `fallSpeed()` and `groundHeight()` helpers.
- [`src/game.js`](src/game.js): scene construction, `chicken()`, `release()`, `plant()`, `startRound()`, controls and the animation loop. Search these names rather than relying on line numbers.
- [`index.html`](index.html): initial control values, bounds, steps and explanatory copy.
- [`styles.css`](styles.css): interface and responsive layout.
- [`../tests/simulation.test.js`](../tests/simulation.test.js): qualitative descent and terrain checks.

## Coordinates and clock

`x` increases right, `y` upwards, and decreasing `z` goes towards the meadow. The fence is at `z = -1`; the tree is at `(-4, 0, 3.1)`. Positions are scene units, not calibrated metres. Wing and weight settings are relative values, not physical measurements.

Each frame uses `dt = min(realElapsedSeconds, 0.05) × playbackSpeed`. Default speed is 1×; range is 0.1×–1×. Flight, movement and timers use `dt`. Some cosmetic poses use wall-clock `t`, so not every visual oscillation slows identically. Reduced-motion preference currently reduces canopy sway only.

## Seed flight

For weight `m` and wing setting `L`:

```text
fall = 0.65 × sqrt((m / 0.3) / L)
caught = clamp((age - 0.25) / 0.45, 0, 1)
vertical speed = (1 - caught) × 1.3 + caught × fall
spin rate = 2 + caught × 18 / sqrt(L)       [radians / simulated second]
horizontal velocity = (windX, windZ) × 2.2 × caught / (fall + 0.4)
```

Position advances directly from these speeds. There is no gravity integration, mass-based collision solver or aerodynamic lift calculation. Spin is an animation, not the cause of descent in the computation. Preserve the intended relationships: larger wings fall slower; heavier seeds fall faster; more time airborne allows more wind drift.

`randomReleasePoint()` samples five lower-canopy/branch locations plus small jitter. A comparison pair shares its origin and height, with x offsets of −0.2/+0.2. Light/heavy pairs use weights 0.1/0.9 and the same wing. Autoplay alternates these with wings 0.5/1.8 at the same weight.

## Wind, fence and landing

- Manual breeze `b` defaults to 0.7: target wind is `(1.2b, -b)`.
- Autoplay samples strength 0–1 every 3–7 simulated seconds. The z direction favours the meadow 85% of the time; x is always positive, with strength multiplied by 1.1–1.45.
- Actual wind eases towards its target by `min(1, 3 × dt)` each frame. Wind updates while a round is playing; its last value persists afterwards for scenery animation.
- Crossing `z = -1` below `y = 1.4` clamps the seed to its original side at −0.98 or −1.02. This is an idealised continuous barrier, not mesh collision against individual rails.
- A seed lands at `groundHeight(x,z) + 0.15`. Within 0.55 of the fence, its z position is moved to −1.65 or −0.35 for visibility, preserving the side it landed on.
- Meadow landings (`z < -1`) increment `planted`, remove the seed and create a sprout rooted on the terrain. Growth reaches full size in about 0.71 simulated seconds with cubic easing.
- Garden landings enter the `landed` list until a chicken finishes collecting them.

Keep terrain rendering, landing checks and sprout placement tied to the same `groundHeight()`. Otherwise plants can appear buried or suspended. Physics does not constrain seeds to the camera viewport.

## Rounds

Ten seeds per round. Manual play releases seeds only when the tree or nearby drop buttons are activated. Autoplay starts with a 0.5-second delay, then releases every 6 seconds. Drop buttons consume the same allowance; Drop pair delays the next scheduled release by 6 seconds. Autoplay disables manual breeze, wing, weight and drop controls.

The round ends only when no seeds remain to release, fly or be collected. Restart clears seeds/sprouts, resets character movement state and wind, but retains chosen control settings. Round meshes are removed from the scene; resource disposal is not yet comprehensive, so monitor GPU memory during extended restart testing.

## Peck and Dot

Both are legless characters moving in the x/z plane. Their body turns towards travel, while the head tracks the first active seed (`flights[0]`); head yaw is limited to ±0.9 radians. Their gaze does not select the nearest seed.

| Behaviour      | Current rule                                                                                                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Normal pursuit | Target first available landed seed; otherwise follow active seed with x offset (Peck −0.35, Dot +0.55) and z clamped to 0.2–4.5; otherwise return home.                                  |
| Pace           | Peck 1.15, Dot 2.3, Dot dash 4.8 scene units/second. Speed eases and slows near the target.                                                                                              |
| `idle`         | Normal pursuit/home behaviour; does not necessarily mean stationary.                                                                                                                     |
| `dash`         | Dot only, while a seed flies and cooldown is zero. Lasts up to 1.3 seconds; starts a 5-second cooldown. Alternates chase with a detour to the tree.                                      |
| `bonk`         | Dot within 0.58 of the tree during a dash stops, tips sideways, displays a message, and recovers over 1.5 seconds. Afterwards cooldown is 4 seconds.                                     |
| `peck`         | Within 0.65 of a landed seed, an eligible chicken claims it and dips its head for 0.85 seconds. Only then is the seed removed and `eaten` incremented. Afterwards cooldown is 2 seconds. |
| Separation     | If characters are closer than 0.8, push them apart equally. Neither knocks the other over.                                                                                               |

`tumble` remains a legacy handled state, but no current action enters it. Claim ownership (`seed.pecker`) prevents both chickens collecting the same seed. Meal targeting skips seeds already claimed by the other chicken. Home positions and tree-bonk coordinates are currently explicit constants: move their related targets together if changing scene layout.

## Decorative feedback

Light-blue wind ribbons follow actual wind. Clouds drift left-to-right faster with stronger wind. Above wind magnitude 0.5, a pool of 24 tumbling leaves can be released. These visuals do not affect flight. All landscape objects share one depth-tested 3D scene; do not reintroduce screen overlays for hills that hide the tree.

## When modifying

1. Change the smallest relevant helper or behaviour block. Keep names and control bounds consistent across HTML and JavaScript.
2. Preserve pair comparability, seed accounting (`left + flying + landed + planted + eaten = 10` during a round), exclusive collection and terrain alignment.
3. Update this reference and tutor notes when the model's meaning changes.
4. Run `npm run format`, `npm run check`, `npm run build` from the repository root. Play-test zero/strong breeze, manual pairs, autoplay, restarts, hill landings and chicken collection. The automated tests do not validate rendered behaviour.

## Local interaction revision

Tree clicks use raycasting; nearby HTML drop buttons provide keyboard access. Both start a round on first use. Manual play waits for input. Short live-region cues replace the running commentary: start, pair comparison, first meadow landing and round result. Event cues appear at most once per round and expire after 6.5 real seconds; the result remains visible.
