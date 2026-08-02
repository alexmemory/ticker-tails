# Ticker Tails

Ticker Tails is a mobile-first prototype that turns an illustrative portfolio into a living, scrolling investment farm.

## What you can test

- Drag or swipe across an expansive, continuously rendered 3D farm valley with three explorable farmsteads.
- Jump among three equally scaled farms—Alex’s classic Ticker Tails Farm, Maya’s solar-and-glass Innovation Homestead, and Jordan’s processor-focused Growth Acres—each with its own technology-stock residents.
- Explore a fully procedural environment with no fixed background image. The rendered terrain extends far beyond the physical hedgerow boundary, with distant wooded ridges hiding every graphical edge.
- Visit real 3D barns, farmhouses, silos, stables, solar sheds, workshops, bridges, fenced fields, orchards, roads, streams, and ponds.
- Watch a PlayCanvas-powered perspective 3D scene with real lighting, shadows, articulated character rigs, smooth state transitions, and environmental effects.
- Read large, high-resolution 3D creature plaques showing each ticker, character name, creature type, habitat, and daily movement.
- Labels counter-scale with camera perspective and automatically collapse crowded groups into tappable numbered clusters.
- Inspect smoother high-density creature meshes with more than six times the sphere density of the original rigs, plus species-specific anatomy for collies, horses, peacocks, beavers, foxes, oxen, flamingos, and hawks.
- See distinct clover, cotton, and corn crops rather than a single reused crop model.
- See Ammo.js rigid bodies collide with the terrain, building walls, fences, bridge decks, tree trunks, stones, troughs, chip blocks, fruit, chargers, perches, and other habitat objects.
- See every resident use a capsule collision body and stay grounded inside its own physical habitat instead of floating across fences.
- Watch animals autonomously roam to local interaction points:
  - NVIDIA’s Emerald Tech-Dragon visits its chip nest.
  - Apple’s Orchard Pig eats at its apple trough.
  - Microsoft’s Cloud-Crafter Owl returns to its loft antenna.
  - Tesla’s Cyber Barn Cat visits its charger.
  - Berkshire’s Mindful Tortoise checks its clover stone.
  - BND’s Anchor Elephant walks to its water trough.
  - Cash reserves grow as a Treasury Clover crop.
- Tap a 3D character to inspect, tend, feed, buy, or sell the illustrative holding; tending sends the animal physically toward its local objective.
- Use simulated $50, $100, and $250 trades. Buying moves value out of Treasury Clover; selling returns it.
- Adjust interest rates, inflation, geopolitics, and investor sentiment in the Market Weather panel.
- See macro conditions alter farm tint, clouds, rain, lightning, wind, and resident activity.
- Spend virtual acorns on optional treats, permanent tricks, skins, and swag.
- Equip a bandana, raincoat, or aurora harness; teach happy-spin and jump tricks.
- Jump between your farm and two neighboring farms, zoom, and recenter the scene.

The applied visual, interaction, accessibility, performance, trust, progression, and production-quality checklist is documented in [`docs/mobile-game-criteria.md`](docs/mobile-game-criteria.md).

All market values, transactions, currency, purchases, and weather inputs are illustrative. The prototype has no brokerage connection, payment account, or checkout and cannot place real trades or purchases.

## Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

No dependency installation is required. The project vendors PlayCanvas 2.21.1 and Ammo.js 0.0.10 in `vendor/`.

## Validate

```bash
npm run check
npm test
npm run build
```
