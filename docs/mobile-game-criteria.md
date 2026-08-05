# Ticker Tails mobile farm-game criteria

This checklist translates common successful farm-simulation patterns into requirements for an investment-learning game. “Baseline” means the current prototype now demonstrates the behavior; “Production” identifies the quality bar for a shipped mobile game.

## 1. Immediate comprehension and core loop

- **Baseline:** The first screen is playable without setup; the farm, holdings, daily care progress, portfolio value, weather, shop, and camera controls are visible immediately.
- **Baseline:** The repeatable loop is clear: find a resident → inspect its need → tend/feed/sell → receive visual, motion, progress, and optional haptic feedback.
- **Baseline:** Direct tapping on residents is the primary interaction; controls supplement the world instead of replacing it.
- **Production:** Add a 30–60 second playable onboarding sequence, contextual coaching that disappears after mastery, and resumable tutorials.
- **Production:** Ensure every session offers one meaningful task in under 10 seconds and a clear stopping point.

## 2. Camera, navigation, and spatial memory

- **Baseline:** One-finger drag pans the camera, zoom controls remain visible, and a home control restores orientation.
- **Baseline:** Maya, Alex, and Jordan each have a full-scale farm with a persistent shortcut and distinctive architecture, roads, fields, habitats, and residents.
- **Baseline:** The valley is ten times larger in each rendered dimension than the previous environment, while hard camera and physics boundaries remain far inside the rendered ground.
- **Baseline:** Major roads, waterways, farm signs, silhouettes, and color palettes act as landmarks.
- **Production:** Add a miniature overview map, discovered-area shading, location breadcrumbs, and an optional “follow resident” camera.

## 3. Visual hierarchy, labels, and density management

- **Baseline:** Creature labels counter-scale with camera distance so their apparent screen size stays approximately stable.
- **Baseline:** Labels provide ticker, name, daily movement, species, and habitat with high contrast and high-resolution textures.
- **Baseline:** Screen-space collision detection replaces overlapping labels with a tappable numeric cluster; tapping expands the hidden labels temporarily.
- **Baseline:** Portfolio and farm controls occupy predictable screen edges while the center remains available for direct manipulation.
- **Production:** Add user-selectable label density, text size, and a “holdings only / all residents” filter.

## 4. Affordance and interaction feedback

- **Baseline:** Interactive elements use button geometry, labels, hover/focus states, press states, disabled states, and action-oriented text.
- **Baseline:** Tap targets are at least 44 CSS pixels for primary game controls; dense world targets have a larger invisible hit radius and clustering fallback.
- **Baseline:** Every trade, care action, farm jump, cluster expansion, and resident selection produces immediate visible feedback; supported devices also receive short haptics.
- **Baseline:** Positive care and buy actions synchronize a character-specific happy dance, a short colorful 3D crystal-and-spark burst, and a quick winner chime within the initiating tap.
- **Baseline:** Destructive-looking actions such as selling require confirmation and explicitly state that they are simulated.
- **Production:** Add positional ambience, distinct haptic patterns, cancelable long actions, and latency-safe optimistic feedback.

## 5. Legibility and accessibility

- **Baseline:** Text is high-contrast, meaningful state is not communicated by color alone, controls have accessible names, keyboard focus is visible, and safe-area insets are respected.
- **Baseline:** The layout adapts to mobile widths and maintains large primary controls.
- **Baseline:** Reduced-motion preferences suppress nonessential interface animation.
- **Baseline:** Reward audio has a persistent, clearly labeled mute control and never blocks interaction.
- **Production:** Provide full screen-reader navigation to every resident and action, scalable text presets, color-vision-safe palettes, captions for all audio, remappable controls, and independent motion/effects sliders.

## 6. World credibility and visual appeal

- **Baseline:** Animals use articulated high-density 3D rigs with a cohesive charming style: three-quarter front presentation, large expressive faces, blinking eyes and catchlights, friendly mouths, connected rounded limbs, readable silhouettes, and gentle squash-and-bounce motion.
- **Baseline:** The world uses bright complementary colors and high-value contrast so residents, actions, paths, fields, water, and buildings read as lively and rewarding instead of muddy or muted.
- **Baseline:** Species remain instantly identifiable through exaggerated anatomy, proportions, gait, wings, tails, ears, trunks, necks, horns, manes, muzzles, and environmental objectives.
- **Baseline:** Clover, cotton, and corn have distinct plant geometry plus friendly animated 3D crop mascots rather than functioning as anonymous field decoration.
- **Baseline:** Buildings, fences, paths, water, bridges, trees, fields, objectives, and obstructions are real scene geometry with lighting, shadows, and physical collision where appropriate.
- **Baseline:** Each farm has a coherent visual identity: Alex’s classic mixed farm, Maya’s glass-and-solar innovation homestead, and Jordan’s processor-and-analytics growth farm.
- **Baseline:** Authored storybook terrain and per-habitat illustration maps add readable near-camera detail without requiring every environmental mark to be separate geometry.
- **Baseline:** Fur, feathers, scales, shells, and skin use repeatable diffuse texture maps, while additional anatomy—primary feathers, talons, claws, joints, wing fingers, shell rims, wrinkles, nostrils, and facial markings—keeps species recognizable.
- **Production:** Replace procedural primitives with authored, optimized, LOD-equipped models; add terrain elevation, inverse-kinematics foot placement, ambient wildlife, particles, and baked lighting.

## 7. Performance and technical resilience

- **Baseline:** High-density creature meshes are shared between instances, labels use pooled cluster markers, and distant labels are culled.
- **Baseline:** The environment uses a repeated procedural terrain texture instead of a single enormous bitmap.
- **Baseline:** Physics is limited to relevant ground, structures, residents, and local props.
- **Production:** Establish 30/60 FPS device tiers, mesh and texture LODs, occlusion culling, instanced vegetation, physics sleep budgets, memory limits, thermal testing, and graceful recovery from WebGL context loss.

## 8. Progression, agency, and motivation

- **Baseline:** Daily care progress, resident growth by allocation, weather response, tricks, treats, and cosmetics provide short- and medium-term feedback.
- **Baseline:** Farms and residents express investment categories spatially, letting players build memory through place and behavior.
- **Baseline:** Every animal habitat shares boundaries with several neighboring animal habitats; autonomous residents periodically meet at those borders for friendly or mildly competitive social gestures.
- **Baseline:** Species-specific routines connect residents to authored locations, including the owl’s launch-and-return loop from the Cloud Library reading loft.
- **Production:** Add goals, unlockable land, habitat upgrades, collections, achievements, rotating events, streak forgiveness, and meaningful non-purchase rewards.

## 9. Economy, trust, and investment safety

- **Baseline:** Real trading and payment are impossible; every transaction and purchase is labeled illustrative or virtual.
- **Baseline:** Buying, selling, risk, thesis, position size, and cash movement remain visible beneath the game metaphor.
- **Baseline:** Neighbor holdings can be observed and tended but cannot be traded from Alex’s portfolio.
- **Production:** Add suitability and risk education, delayed/attributed market data, brokerage-grade disclosures, parental controls where relevant, purchase restoration, spending controls, and transparent randomized-item odds if such items ever exist.

## 10. Social farms and long-term content

- **Baseline:** Three persistent farms have equal spatial importance, distinct owners, layouts, structures, technology-stock sets, and one-tap navigation.
- **Baseline:** Neighbor visits model discovery without changing the player’s portfolio.
- **Production:** Add permission-aware visits, cooperative goals, asynchronous help, moderation, privacy controls, block/report tools, seasonal farm themes, and content-authoring pipelines.

## 11. Responsive layout and device fit

- **Baseline:** The game fills the safe viewport, avoids page scrolling during play, supports touch and pointer input, and keeps critical controls away from device cutouts.
- **Baseline:** Panels and drawers remain dismissible and preserve world context.
- **Production:** Validate common phone and tablet aspect ratios in both orientations, foldables, low-memory devices, interruption/resume behavior, offline states, and localization expansion.

## 12. Quality validation

- **Baseline:** Automated checks cover portfolio reconciliation, behavior simulation, weather behavior, species placement, 3D physics, high-density meshes, procedural terrain, farm separation, and label clustering.
- **Production:** Add device-lab performance budgets, accessibility audits, task-based usability sessions, analytics for failed interactions, crash monitoring, save migration tests, and regular economy/balance reviews.

## Reference baseline

- Apple Human Interface Guidelines: Designing for games, Game controls, Accessibility, Typography, and Haptics.
- Android accessibility design guidance.
- WCAG 2.2 contrast and target-size guidance.
- FarmVille 3’s published feature set: direct animal care, crops, building, customization, expansion, weather, neighbor visits, social play, events, and optional purchases.
