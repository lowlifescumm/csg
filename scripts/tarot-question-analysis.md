# Tarot Reading Question Analysis

## Current Question Requirements

Based on the tarot-spreads.json configuration, here's the analysis of which spreads should require questions:

### Spreads That Should NOT Require Questions (Daily/General Guidance)
1. **Daily Tarot** (`daily_tarot`)
   - `allow_question: false`
   - Purpose: General daily guidance
   - Should NOT have question input

### Spreads That Should Require Questions (Personal/Question-Specific)
2. **Yes/No Tarot** (`yes_no`)
   - `allow_question: true`
   - `require_question: true` (explicitly required)
   - Purpose: Answer specific yes/no questions
   - **MUST have question input**

3. **Daily Love Tarot** (`daily_love`)
   - `allow_question: true`
   - Purpose: Romantic guidance (can be general or specific)
   - **SHOULD have question input** (optional but recommended)

4. **Daily Career Tarot** (`daily_career`)
   - `allow_question: true`
   - Purpose: Career guidance (can be general or specific)
   - **SHOULD have question input** (optional but recommended)

5. **Love Potential Tarot** (`love_potential`)
   - `allow_question: true`
   - Purpose: Assess romantic potential
   - **SHOULD have question input** (optional but recommended)

6. **Breakup Tarot** (`breakup`)
   - `allow_question: true`
   - Purpose: Post-breakup guidance
   - **SHOULD have question input** (optional but recommended)

7. **One Card Tarot** (`one_card`)
   - `allow_question: true`
   - Purpose: Focused guidance
   - **SHOULD have question input** (optional but recommended)

8. **Past Present Future** (`past_present_future`)
   - `allow_question: true`
   - Purpose: Timeline reading
   - **SHOULD have question input** (optional but recommended)

9. **Yin Yang Tarot** (`yin_yang`)
   - `allow_question: true`
   - Purpose: Balance opposing energies
   - **SHOULD have question input** (optional but recommended)

10. **Daily Flirt Tarot** (`daily_flirt`)
    - `allow_question: true`
    - Purpose: Playful romantic energy
    - **SHOULD have question input** (optional but recommended)

## Current Implementation Status

### ✅ Working Correctly
- **InteractiveTarotSelector**: Properly checks `spread.ui?.require_question` and shows question input when needed
- **API validation**: Both `/api/tarot` and `/api/readings/create` validate question requirements
- **Yes/No Tarot**: Correctly requires questions

### ❌ Issues Found
- **Daily Love, Career, Love Potential, Breakup, One Card, PPF, Yin Yang, Flirt**: These spreads allow questions but the UI doesn't consistently show the question input
- **Question input logic**: Only shows when `require_question: true`, but many spreads should show optional question input

## Recommended Changes

### 1. Update Spread Configuration
Add `require_question: true` to spreads that should always require questions:
- Yes/No Tarot (already has it)
- Love Potential Tarot
- Breakup Tarot
- One Card Tarot
- Past Present Future

### 2. Update UI Logic
Modify InteractiveTarotSelector to show question input for spreads with `allow_question: true`, not just `require_question: true`

### 3. Add Optional Question Input
For spreads that allow but don't require questions, show an optional question input field.
