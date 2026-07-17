# Security Specifications (TDD Spec)

## 1. Data Invariants
- **Player Integrity**: Every player must have a valid ID, custom or preset avatar (string), name (string max 100 characters), and skill level.
- **Match Soundness**: Every match must map to an existing court, have team sizes <= 10, valid enum states for status and winner, and positive integer metrics (duration, shuttlecocks).
- **Booking Bounds**: Every booking must target a specific court and include a valid `YYYY-MM-DD` date, name, time slot, and phone number.

## 2. The "Dirty Dozen" Payloads (Exploit Scenarios)
1. **Malicious Player Name Over-Sizing**: Creating a player with a name longer than 100 characters.
2. **Invalid Skill Level Enum**: Submitting a player with a skill level `god_tier`.
3. **Invalid Player Status Enum**: Submitting a player with status `sleeping`.
4. **Court with Negative ID length**: Court ID containing spaces or invalid characters.
5. **Ghost Fields on Court**: Creating a court with extra unauthorized schema keys (e.g. `isAdmin: true`).
6. **Negative Match Shuttlecocks count**: Attempting to record `-5` shuttlecocks used in a match.
7. **Negative Match Duration**: Setting match duration to `-15` minutes.
8. **Malicious Team Sizes**: Overpopulating `teamA` with more than 10 player IDs to cause resource exhaustion.
9. **Invalid Match Status Enum**: Setting a match status to `paused`.
10. **Malformed Booking Date**: Creating a booking with date format `17-07-2026`.
11. **Excessively long booker name**: Booking with bookerName longer than 100 characters.
12. **Ghost Fields on Booking**: Attempting to inject extra tracking keys on court booking.

## 3. The Test Runner Configuration
The ESLint security rule checker handles ruleset verification before deployment to Firebase. All 12 malicious payloads are blocked by the strict schema assertions in the `firestore.rules` validators.
