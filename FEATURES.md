# CosmicSpiritGuide.com — Feature Checklist & Acceptance Criteria

> **Version:** 3.0  
> **Last Updated:** 2026-05-11  
> **Purpose:** This document defines every user-facing feature on cosmicspiritguide.com and its expected behavior. Paperclip agents must verify each item during audits, bug hunts, and QA cycles. A feature is "working" only if it meets ALL criteria in its section.

---

## 1. Homepage (`/`)

### 1.1 Hero Section
- [ ] Page loads in < 3 seconds on a standard connection
- [ ] Title reads: "Cosmic Spirit Guide — Free Tarot & Astrology Readings"
- [ ] Subtitle/tagline is visible: "Powered by AI • Tarot • Horoscopes • Birth Charts"
- [ ] CTA buttons are present and clickable (e.g., "Get Your Reading", "Explore Tarot")
- [ ] No console errors on load

### 1.2 Navigation
- [ ] All nav links work: Tarot, Horoscopes, Birth Charts, Compatibility
- [ ] Mobile hamburger menu opens/closes correctly
- [ ] Active page is visually indicated in the nav

### 1.3 Footer
- [ ] Links present: Privacy Policy, Terms of Service, Contact
- [ ] All footer links navigate to correct pages
- [ ] Copyright/current year is displayed

---

## 2. Tarot Readings (`/tarot`)

### 2.1 Page Load
- [ ] Page loads without errors
- [ ] Title/heading confirms "Free Online Tarot Card Reading"
- [ ] Description explains: "Basic tarot readings are free"

### 2.2 Card Selection
- [ ] User can select a tarot spread type (e.g., Single Card, Three Card, Celtic Cross)
- [ ] Cards are visually rendered (not placeholder text)
- [ ] Card flip/reveal animation works smoothly
- [ ] Selected cards are distinct (no duplicates in a single reading unless spread allows)

### 2.3 AI Interpretation
- [ ] After card selection, an AI-generated interpretation appears
- [ ] Interpretation is relevant to the selected cards and spread
- [ ] No generic/fallback text like "Loading..." or "Error" appears
- [ ] Interpretation loads within 10 seconds

### 2.4 Birth Chart Cross-Sell
- [ ] Section visible: "Combine tarot wisdom with your astrological blueprint"
- [ ] Link to `/birth-chart` works
- [ ] CTA: "Get Your Birth Chart" is clickable

### 2.5 Sharing / Saving
- [ ] User can copy or share their reading (if feature exists)
- [ ] No data loss on page refresh (if readings are meant to persist)

---

## 3. Horoscopes (`/horoscope` or `/horoscopes`)

### 3.1 Page Load
- [ ] Page loads without errors
- [ ] Heading confirms "Daily Horoscope" or similar

### 3.2 Zodiac Sign Selection
- [ ] All 12 zodiac signs are selectable (Aries through Pisces)
- [ ] Sign selection updates the reading dynamically
- [ ] Default sign can be set or remembered (if cookie/localStorage feature exists)

### 3.3 Daily Reading Content
- [ ] AI-generated daily horoscope text appears for selected sign
- [ ] Content is unique per sign (not identical across all 12)
- [ ] Date is clearly displayed (today's date)
- [ ] Content updates daily (not static/cached indefinitely)
- [ ] No placeholder or Lorem Ipsum text

### 3.4 Additional Horoscope Features
- [ ] Weekly/Monthly toggle works (if applicable)
- [ ] Love, Career, Health sub-sections load correctly (if applicable)

---

## 4. Birth Chart (`/birth-chart`)

### 4.1 Page Load
- [ ] Page loads without errors
- [ ] Heading confirms "Free Birth Chart" or "Natal Chart"

### 4.2 Data Input Form
- [ ] Form accepts: Birth Date, Birth Time, Birth Location (City/Country)
- [ ] Date picker works correctly (no invalid dates accepted)
- [ ] Time input accepts 24h or AM/PM format
- [ ] Location autocomplete or dropdown works (if integrated with geocoding API)
- [ ] Form validates all required fields before submission
- [ ] Clear error messages for invalid input (e.g., "Please enter a valid date")

### 4.3 Chart Generation
- [ ] Submitting the form generates a personalized birth chart
- [ ] Chart displays: Sun sign, Moon sign, Rising sign (Ascendant)
- [ ] Planetary positions are listed (Mercury, Venus, Mars, Jupiter, Saturn, etc.)
- [ ] Houses are displayed (1st–12th)
- [ ] Aspect table or wheel visualization renders correctly
- [ ] Generation completes within 15 seconds

### 4.4 AI Interpretation
- [ ] AI-generated summary of the birth chart appears
- [ ] Summary is personalized (mentions the user's specific placements)
- [ ] No generic template text that ignores the actual chart data
- [ ] Sections for personality, relationships, career are present (if applicable)

---

## 5. Compatibility (`/compatibility`)

### 5.1 Page Load
- [ ] Page loads without errors
- [ ] Heading confirms "Compatibility Test" or "Synastry Reading"

### 5.2 Partner Input
- [ ] Form accepts two people's birth details (Person A and Person B)
- [ ] Same validation as Birth Chart form applies to both inputs


### 5.3 Compatibility Report
- [ ] Report generates after both inputs are submitted
- [ ] Overall compatibility score/percentage is displayed
- [ ] Breakdown by category: Emotional Connection, Communication, Romantic Chemistry, Long-term Potential
- [ ] Each category has a score and a short interpretation
- [ ] Report references actual planetary placements, not just Sun signs
- [ ] No placeholder text or "Coming Soon" messages

---

## 6. Reports — Essential (`/reports/essential`)

The Essential Report is the entry-level comprehensive birth chart analysis. It provides the foundational astrological profile.

### 6.1 Page Load & Access
- [ ] Page loads without errors
- [ ] Heading confirms "Essential Report" or "Birth Chart Analysis"
- [ ] Report is accessible after birth chart submission (or standalone with birth data)
- [ ] If premium: paywall/gate works correctly, payment processes
- [ ] If free: no unexpected paywall blocks access
- [ ] Report renders cleanly on mobile and desktop

### 6.2 Birth Chart Visualization
- [ ] Natal chart wheel renders correctly with all planets positioned
- [ ] Special Points visible: North Node, South Node, Chiron, Part of Fortune
- [ ] Chart Patterns listed: T-Squares, Stelliums, Grand Trines, etc.
- [ ] Planets in Houses table is accurate and complete
- [ ] Elements breakdown (Fire, Earth, Air, Water) with counts
- [ ] Modalities breakdown (Cardinal, Fixed, Mutable) with counts
- [ ] Moon Phase displayed with icon and label
- [ ] ASC (Ascendant) and MC (Midheaven) clearly labeled
- [ ] Chart Ruler identified
- [ ] Retrograde planets marked with ℞ symbol
- [ ] Aspect grid renders with all major aspects (Conjunction, Opposition, Trine, Square, Sextile)

### 6.3 AI-Generated Content
- [ ] Personalized birth chart analysis text appears
- [ ] Content references the user's actual planetary placements (not generic)
- [ ] Sections include: personality overview, strengths, challenges
- [ ] Sun sign, Moon sign, Rising sign are explained in context
- [ ] No placeholder or template filler text No hallucinations AI only interprets already calculated data
- [ ] Text is coherent, astrologically grounded, and actionable

### 6.4 Delivery
- [ ] Report can be viewed in-browser without layout breaks
- [ ] Report can be printed or downloaded as PDF (if applicable)
- [ ] Report can be shared (if applicable)
- [ ] Content persists if user returns later (if account/save feature exists)

---

## 7. Reports — Advanced (`/reports/advanced`)

The Advanced Report builds on the Essential Report with deeper analysis across all life areas.

### 7.1 Page Load & Access
- [ ] Page loads without errors
- [ ] Heading confirms "Advanced Report"
- [ ] Report is accessible after birth chart submission
- [ ] Upgrade flow from Essential works: CTA visible, payment processes, content unlocks
- [ ] If free: no unexpected paywall blocks access
- [ ] Report renders cleanly on mobile and desktop

### 7.2 Content — All Essential Sections PLUS:
- [ ] Detailed house placements for ALL planets (not just Sun/Moon/Rising)
- [ ] Aspect interpretations: each major aspect explained in narrative form
- [ ] Career path analysis with specific guidance based on 10th House/MC and relevant planets
- [ ] Relationship compatibility insights from solo perspective (not partner comparison)
- [ ] Life purpose / North Node analysis with growth direction
- [ ] Financial outlook based on 2nd House and Jupiter/Saturn placements
- [ ] Health and wellness insights based on 6th House and relevant planets

### 7.3 AI Quality
- [ ] All content is AI-generated and personalized to the user's specific chart
- [ ] No generic template text that could apply to any chart
- [ ] Each section references actual planetary degrees, signs, and houses
- [ ] Advice is practical and actionable, not vague
- [ ] Content length is substantive (not 2-3 sentences per section)

### 7.4 Delivery
- [ ] Report can be viewed in-browser without layout breaks
- [ ] Long-form sections are paginated or have clear section headers
- [ ] Report can be printed or downloaded as PDF (if applicable)
- [ ] Content is distinct from Essential Report (not just a reprint)

---

## 8. Reports — Master (`/reports/master`)

The Master Report is the premium tier — a comprehensive, year-ahead life guide that combines the user's birth chart, current transits, compatibility (if partner data exists), and karmic/shadow work into a single, cohesive document.

### 8.1 Page Load & Access
- [ ] Page loads without errors
- [ ] Heading confirms "Master Report" or "Cosmic Spirit Guide Master Report"
- [ ] Report is accessible after birth chart submission (and partner data if compatibility included)
- [ ] Upgrade flow from Advanced works: CTA visible, payment processes, content unlocks
- [ ] If free: no unexpected paywall blocks access
- [ ] Report renders cleanly on mobile and desktop
- [ ] Long-form report is paginated or has a table of contents for navigation

### 8.2 Cover / Title Page
- [ ] Report title: "MASTER REPORT" prominently displayed
- [ ] User's name displayed: "Prepared for [First Name] [Last Name]"
- [ ] Generation date displayed: "Generated on [Month Day, Year]"
- [ ] Site branding: "Cosmic Spirit Guide" or "www.cosmicspiritguide.com"
- [ ] Footer with generation date repeats on each page

### 8.3 Birth Chart Visualization (Page 2)
- [ ] Full natal chart wheel renders with all planets, houses, aspects
- [ ] Birth location and time displayed: "[City] [State/Country], [Month Day, Year] at [Time]"
- [ ] ASC, MC, Chart Ruler labeled
- [ ] Special Points, Chart Patterns, Planets in Houses, Elements, Modalities, Moon Phase all visible
- [ ] Aspect grid renders at bottom
- [ ] No overlapping text, no cut-off elements, no rendering artifacts

### 8.4 Relationship Matrix (if partner data provided)
- [ ] "Relationship Matrix" section heading present
- [ ] Narrative analysis of the relationship dynamic
- [ ] Scores displayed for each dimension:
  - Emotional Connection: [score]/100
  - Communication: [score]/100
  - Spiritual Connection: [score]/100
  - Stability: [score]/100
  - Physical Chemistry: [score]/100
- [ ] Each score has a 2-3 paragraph interpretation explaining the dynamic
- [ ] Radar chart / pentagon visualization renders with all 5 dimensions labeled
- [ ] Scores table displays: Dimension name + percentage score
- [ ] Analysis references both partners' actual placements (Sun, Moon, etc.)
- [ ] No generic relationship advice — specific to the two charts

### 8.5 Compatibility Analysis (if partner data provided)
- [ ] Personalized greeting: "Dear [User Name], as you embark on this journey with [Partner Name]..."
- [ ] Emotional Chemistry section with specific inter-aspect analysis
- [ ] Communication Flow section with Mercury inter-aspect analysis
- [ ] Sources of Friction section identifying the most challenging inter-aspect
- [ ] Long-Term Potential section with Composite Chart analysis (Composite Sun, Moon, House placements)
- [ ] Harmony and Growth section with actionable bullet-point guidance
- [ ] Closing paragraph with blessing/encouragement
- [ ] All analysis references actual inter-aspects between the two charts
- [ ] Partner's name is correctly spelled and consistently used throughout

### 8.6 Extended Transit Forecast
- [ ] "Extended Transit Forecast" section heading present
- [ ] Overview paragraph sets the context for the forecast period
- [ ] Week-by-Week Breakdown with specific date ranges
- [ ] Each significant transit includes:
  - Exact date: "[Month Day, Year]: Transiting [Planet] [Aspect] your Natal [Planet] (at [Degree] [Sign]) in your [Nth] House of [theme]"
  - Natal Point reference
  - House Impact explanation
  - Meaning: what the transit signifies in the user's life
  - Actionable Guidance: practical advice for navigating the transit
- [ ] Major Themes summary at the end of the forecast
- [ ] Key Dates to Watch list with all significant transit dates
- [ ] Transits are calculated from the report generation date forward (not backward)
- [ ] Transit dates are astronomically plausible (no impossible configurations)
- [ ] No placeholder text like "Given the lack of specific transits, I will provide a general forecast"

### 8.7 Annual Forecast
- [ ] "Annual Forecast" section heading present
- [ ] Overview paragraph with themes for the year
- [ ] Month-by-Month Breakdown (or longer period for extended forecasts)
- [ ] Each month includes specific transit events with:
  - Date, planet, aspect, natal point, house, meaning, actionable guidance
- [ ] Major Themes summary listing primary life areas being activated
- [ ] Actionable Guidance section with focus areas
- [ ] Closing encouragement paragraph
- [ ] No "No specific transits provided" fallback text

### 8.8 Karmic & Shadow Work
- [ ] "Karmic & Shadow Work" section heading present
- [ ] Understanding Your Nodal Axis subsection:
  - North Node sign, house, and meaning explained
  - South Node sign, house, and comfort-zone patterns explained
  - The Core Karmic Lesson narrative
- [ ] Emotional Patterns to Break subsection:
  - Specific patterns tied to the Nodal Axis placement
  - Practical advice for breaking each pattern
- [ ] Hidden Strengths subsection:
  - Gifts from the South Node that can be integrated
- [ ] Old Cycles to Release subsection:
  - Patterns to release in both South Node and North Node houses
- [ ] 3-5 Practical Shadow Work Exercises:
  - Each exercise has a title and 3-5 actionable steps
  - Exercises are specific to the Nodal Axis placement (not generic journaling prompts)
- [ ] Integration and Growth subsection with closing guidance
- [ ] All content references the user's actual North/South Node signs and houses

### 8.9 Closing Blessing
- [ ] "Closing Blessing" section heading present
- [ ] Personalized greeting: "Dear [User Name],"
- [ ] References key themes from earlier sections (birth chart, compatibility, transits, karmic work)
- [ ] Blessing quote is personalized (mentions specific placements, partner name if applicable)
- [ ] Closing signature: "In Spiritual Harmony, Cosmic Spirit Guide"
- [ ] Tone is warm, encouraging, and spiritually grounded

### 8.10 Master Report — Cross-Section Consistency
- [ ] User's name is spelled correctly and consistently throughout ALL sections
- [ ] Partner's name (if applicable) is spelled correctly and consistent
- [ ] Birth data (date, time, location) is consistent across chart wheel and text
- [ ] Planetary placements referenced in text match the chart wheel visualization
- [ ] Transit dates in Extended Forecast and Annual Forecast do not contradict each other
- [ ] Karmic Nodal Axis analysis aligns with the birth chart's North/South Node positions
- [ ] No duplicate or near-duplicate paragraphs across sections
- [ ] Each section adds unique value (not repetitive rephrasing of the same content)

### 8.11 Master Report — PDF Generation (if applicable)
- [ ] PDF renders correctly with all pages in order
- [ ] Chart wheel image is crisp, not pixelated or stretched
- [ ] Radar chart renders correctly in Relationship Matrix
- [ ] Text does not overflow page boundaries
- [ ] Headers and footers appear on every page
- [ ] Page numbers are present (if applicable)
- [ ] File size is reasonable (< 10MB for a typical report)

---

## 9. Transits (`/transits`)

### 9.1 Page Load
- [ ] Page loads without errors
- [ ] Heading confirms "Transits" or "Daily Transits" or similar

### 9.2 Transit Data
- [ ] Current planetary transits are calculated based on today's date
- [ ] Transits are personalized to the user's birth chart (if logged in / chart saved)
- [ ] Each transit shows: planet, aspect, affected natal planet/house, exact date
- [ ] Transit descriptions are AI-generated and explain the real-world meaning
- [ ] Retrograde periods are clearly marked
- [ ] Upcoming transits are listed with dates

### 9.3 Visualization
- [ ] Transit timeline or calendar view renders correctly
- [ ] Active transits are visually distinguished from upcoming/past
- [ ] Mobile layout stacks correctly

### 9.4 Accuracy
- [ ] Transit dates match real astronomical data (within reasonable tolerance)
- [ ] Aspects are correctly calculated (conjunction 0°, opposition 180°, etc.)
- [ ] No impossible transits (e.g., Pluto conjunct Sun in 3 days)

---

## 10. Moon Reading (`/moon-reading`)

### 10.1 Page Load
- [ ] Page loads without errors
- [ ] Heading confirms "Moon Reading" or "Lunar Reading" or similar

### 10.2 Moon Data
- [ ] Current moon phase is displayed (New, Waxing Crescent, First Quarter, etc.)
- [ ] Moon sign is shown (e.g., "Moon in Scorpio")
- [ ] Moon's current house position is displayed (if applicable)
- [ ] Moon's exact degree is shown

### 10.3 Personalized Reading
- [ ] Reading is personalized to the user's birth chart (if available)
- [ ] Explains how the current moon phase/sign affects the user specifically
- [ ] Emotional / intuitive guidance is provided
- [ ] Ritual or action suggestions are relevant to the moon phase
- [ ] Content updates as the moon changes phase/sign

### 10.4 Accuracy
- [ ] Moon phase matches real astronomical data for today's date
- [ ] Moon sign is correct for the current date/time
- [ ] No stale data (e.g., showing yesterday's moon phase)

---

## 11. Daily Streak (`/streak` or integrated into dashboard)

### 11.1 Streak Display
- [ ] Streak counter is visible to logged-in users
- [ ] Counter shows: current streak (consecutive days), longest streak
- [ ] Visual indicator (flame, stars, etc.) renders correctly

### 11.2 Streak Mechanics
- [ ] Streak increments when user visits and completes a daily action (horoscope, tarot, etc.)
- [ ] Streak resets correctly after missing a day (no false positives)
- [ ] Streak does NOT increment twice in one day (anti-gaming)
- [ ] Timezone is respected (streak day boundaries align with user's local midnight)

### 11.3 Rewards / Milestones
- [ ] Milestone notifications appear at 7, 30, 100 days (or defined intervals)
- [ ] Rewards (badges, unlocks, discounts) are granted correctly
- [ ] Milestone history is viewable

### 11.4 Persistence
- [ ] Streak data persists across sessions (database, not just localStorage)
- [ ] Streak survives logout/login
- [ ] Streak data is not lost on page refresh

---

## 12. Weekly Energy Forecast (`/weekly-energy` or `/forecast`)

### 12.1 Page Load
- [ ] Page loads without errors
- [ ] Heading confirms "Weekly Energy Forecast" or similar

### 12.2 Forecast Content
- [ ] Covers the current week (Monday–Sunday or user's locale)
- [ ] Overview of the week's dominant astrological energy
- [ ] Day-by-day breakdown with specific transits affecting the week
- [ ] Personalized to the user's Sun/Rising sign (if chart available)
- [ ] Themes for the week: general, love, career, health
- [ ] Actionable advice / "what to focus on" section

### 12.3 Timing & Freshness
- [ ] Forecast updates every Monday (or at the start of the user's week)
- [ ] Previous week's forecast is archived or replaced (not mixed with current)
- [ ] Date range is clearly displayed (e.g., "May 11 – May 17, 2026")
- [ ] No stale forecast from last week showing as current

### 12.4 AI Quality
- [ ] Content is AI-generated, not static/template
- [ ] References real upcoming transits for the week
- [ ] Advice is practical and tied to the astrological events
- [ ] No generic "have a good week" filler

---

## 13. AI Backend & API Features

### 13.1 AI Response Quality
- [ ] All AI-generated content (tarot, horoscope, birth chart, compatibility, reports, transits, moon, forecast) is coherent and astrologically grounded
- [ ] No hallucinated zodiac signs or impossible planetary positions
- [ ] Content is appropriate (no offensive, harmful, or nonsensical output)

### 13.2 API Reliability
- [ ] AI endpoints respond within 15 seconds under normal load
- [ ] Graceful fallback if AI service is temporarily unavailable (e.g., cached content, retry logic)
- [ ] Rate limiting is enforced to prevent abuse
- [ ] No API keys or credentials are exposed in client-side code

---

## 14. User Experience & Performance

### 14.1 Accessibility
- [ ] All interactive elements are keyboard-navigable
- [ ] Alt text on images (tarot cards, chart visuals)
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen reader labels on form inputs

### 14.2 Mobile Responsiveness
- [ ] All pages render correctly on 375px–768px widths
- [ ] Touch targets are ≥ 44×44px
- [ ] No horizontal scrolling
- [ ] Card layouts stack vertically on mobile

### 14.3 Performance
- [ ] Lighthouse Performance score ≥ 70
- [ ] No render-blocking resources
- [ ] Images are optimized (WebP/AVIF where supported)
- [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

---

## 15. Legal & Compliance Pages

### 15.1 Privacy Policy (`/privacy`)
- [ ] Page loads and displays full privacy policy text
- [ ] Content covers: data collection, cookies, third-party services, user rights
- [ ] Last updated date is visible

### 15.2 Terms of Service (`/terms`)
- [ ] Page loads and displays full ToS text
- [ ] Content covers: usage rules, disclaimers, liability, termination
- [ ] Last updated date is visible

### 15.3 Contact (`/contact`)
- [ ] Page loads
- [ ] Contact form or email link is present and functional
- [ ] If form exists: submits without error, sends to correct recipient

---

## 16. SEO & Meta

- [ ] Each page has unique `<title>` and `<meta name="description">`
- [ ] Open Graph tags present for social sharing
- [ ] Canonical URLs set correctly
- [ ] No broken internal links (404s)
- [ ] Sitemap.xml is accessible and up-to-date
- [ ] Robots.txt is present and correct

---

## 17. Error Handling & Edge Cases

- [ ] 404 page is styled and has a link back to homepage
- [ ] 500/server error shows a friendly message (not raw stack trace)
- [ ] Invalid birth dates (e.g., Feb 30) are rejected with clear error
- [ ] Empty form submissions are blocked with validation
- [x] Network timeout shows retry option or friendly message
- [ ] JavaScript-disabled fallback (if site requires JS, show a notice)

---

## Audit Instructions for Paperclip Agents

1. **Run the site locally** or access the staging/production URL.
2. **Go through each section** in order. Check every checkbox.
3. **For any unchecked item**, create a bug ticket with:
   - Feature name and section number
   - Expected behavior (from this doc)
   - Actual behavior (what you observed)
   - Steps to reproduce
   - Screenshot or console log if applicable
4. **Prioritize:**
   - P0 (Critical): Site won't load, core feature completely broken, data leak, wrong astrological calculations, report generates with placeholder text, user's name misspelled in a paid report
   - P1 (High): Major feature partially broken, significant UX degradation, stale content (old horoscope, last week's forecast), report section missing (e.g., Karmic & Shadow Work absent from Master Report)
   - P2 (Medium): Minor feature glitch, visual inconsistency, missing milestone notification, chart wheel slightly misaligned
   - P3 (Low): Cosmetic issue, enhancement opportunity, typo in non-critical text
5. **After fixing:** Re-run the checklist for that section to verify.

---

*End of checklist. Update this document whenever new features are added or existing ones change.*
