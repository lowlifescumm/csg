// PSEO-optimized tarot data with SEO metadata and zodiac associations
// Enriched with slugs, element associations, zodiac links, keywords, and descriptions

const BASE_IMAGE_URL = 'https://raw.githubusercontent.com/lowlifescumm/tarot/master/img/big';

// Major Arcana with SEO enrichment
export const MAJOR_ARCANA_ENRICHED = [
  {
    id: 0,
    name: 'The Fool',
    slug: 'the-fool',
    image: BASE_IMAGE_URL + '/maj00.jpg',
    upright: 'New beginnings, innocence, spontaneity, free spirit',
    reversed: 'Recklessness, taken advantage of, inconsideration',
    element: null,
    zodiac: ['Uranus', 'Aquarius'],
    keywords: ['the fool tarot', 'fool card meaning', 'new beginnings tarot', 'tarot fool upright', 'tarot fool reversed', 'fool tarot love'],
    description: 'The Fool represents new beginnings, innocence, and the spontaneous leap of faith. As the start of the Major Arcana journey, this card signifies infinite potential and the courage to embrace the unknown.',
    category: 'major-arcana'
  },
  {
    id: 1,
    name: 'The Magician',
    slug: 'the-magician',
    image: BASE_IMAGE_URL + '/maj01.jpg',
    upright: 'Manifestation, resourcefulness, power, inspired action',
    reversed: 'Manipulation, poor planning, untapped talents',
    element: null,
    zodiac: ['Mercury', 'Gemini', 'Virgo'],
    keywords: ['the magician tarot', 'magician card meaning', 'manifestation tarot', 'tarot magician upright', 'magician love meaning', 'tarot manifestation'],
    description: 'The Magician channels universal energy to manifest desires into reality. Representing mastery of the elements and personal power, this card encourages you to use your skills and resources to achieve your goals.',
    category: 'major-arcana'
  },
  {
    id: 2,
    name: 'The High Priestess',
    slug: 'the-high-priestess',
    image: BASE_IMAGE_URL + '/maj02.jpg',
    upright: 'Intuition, sacred knowledge, divine feminine, subconscious mind',
    reversed: 'Secrets, disconnected from intuition, withdrawal',
    element: null,
    zodiac: ['Moon', 'Cancer'],
    keywords: ['high priestess tarot', 'priestess card meaning', 'intuition tarot', 'tarot high priestess love', 'divine feminine tarot', 'subconscious tarot'],
    description: 'The High Priestess guards the threshold between conscious and subconscious realms. She invites you to trust your intuition and access the deep wisdom within your inner sanctuary.',
    category: 'major-arcana'
  },
  {
    id: 3,
    name: 'The Empress',
    slug: 'the-empress',
    image: BASE_IMAGE_URL + '/maj03.jpg',
    upright: 'Femininity, beauty, nature, nurturing, abundance',
    reversed: 'Creative block, dependence on others, emptiness',
    element: null,
    zodiac: ['Venus', 'Taurus', 'Libra'],
    keywords: ['the empress tarot', 'empress card meaning', 'abundance tarot', 'tarot empress love', 'fertility tarot', 'empress tarot meaning'],
    description: 'The Empress embodies divine feminine energy, fertility, and earthly abundance. She represents creativity, sensuality, and the nurturing power that brings ideas and relationships to full bloom.',
    category: 'major-arcana'
  },
  {
    id: 4,
    name: 'The Emperor',
    slug: 'the-emperor',
    image: BASE_IMAGE_URL + '/maj04.jpg',
    upright: 'Authority, establishment, structure, father figure',
    reversed: 'Domination, excessive control, lack of discipline',
    element: null,
    zodiac: ['Mars', 'Aries', 'Capricorn'],
    keywords: ['the emperor tarot', 'emperor card meaning', 'authority tarot', 'tarot emperor love', 'structure tarot', 'emperor tarot career'],
    description: 'The Emperor represents structure, authority, and the power of logical thinking. He builds lasting foundations through discipline and strategic planning, embodying the mature masculine principle.',
    category: 'major-arcana'
  },
  {
    id: 5,
    name: 'The Hierophant',
    slug: 'the-hierophant',
    image: BASE_IMAGE_URL + '/maj05.jpg',
    upright: 'Spiritual wisdom, religious beliefs, conformity, tradition',
    reversed: 'Personal beliefs, freedom, challenging the status quo',
    element: null,
    zodiac: ['Saturn', 'Capricorn', 'Taurus'],
    keywords: ['the hierophant tarot', 'hierophant card meaning', 'tradition tarot', 'tarot hierophant love', 'spiritual wisdom tarot', 'hierophant meaning'],
    description: 'The Hierophant represents spiritual tradition and the transfer of sacred knowledge. He bridges the gap between divine wisdom and earthly understanding through established institutions and beliefs.',
    category: 'major-arcana'
  },
  {
    id: 6,
    name: 'The Lovers',
    slug: 'the-lovers',
    image: BASE_IMAGE_URL + '/maj06.jpg',
    upright: 'Love, harmony, relationships, values alignment, choices',
    reversed: 'Self-love, disharmony, imbalance, misalignment of values',
    element: null,
    zodiac: ['Mercury', 'Gemini'],
    keywords: ['the lovers tarot', 'lovers card meaning', 'love tarot card', 'tarot lovers relationship', 'soulmate tarot', 'lovers card love'],
    description: 'The Lovers represent meaningful relationships, soul connections, and the choices that define our path. This card speaks to harmony between opposites and the alignment of heart and mind.',
    category: 'major-arcana'
  },
  {
    id: 7,
    name: 'The Chariot',
    slug: 'the-chariot',
    image: BASE_IMAGE_URL + '/maj07.jpg',
    upright: 'Control, willpower, success, action, determination',
    reversed: 'Self-discipline, opposition, lack of direction',
    element: null,
    zodiac: ['Moon', 'Cancer'],
    keywords: ['the chariot tarot', 'chariot card meaning', 'willpower tarot', 'tarot chariot love', 'success tarot', 'chariot tarot career'],
    description: 'The Chariot represents triumph through willpower and determination. By harnessing opposing forces and maintaining focus, the Chariot achieves victory through sheer force of intention.',
    category: 'major-arcana'
  },
  {
    id: 8,
    name: 'Strength',
    slug: 'strength',
    image: BASE_IMAGE_URL + '/maj08.jpg',
    upright: 'Strength, courage, persuasion, influence, compassion',
    reversed: 'Inner strength, self-doubt, low energy, raw emotion',
    element: null,
    zodiac: ['Sun', 'Leo'],
    keywords: ['strength tarot', 'strength card meaning', 'courage tarot', 'tarot strength love', 'inner strength tarot', 'leo tarot card'],
    description: 'Strength represents the power of gentle persuasion over brute force. True courage comes from compassion and patience, mastering the inner beast through understanding rather than domination.',
    category: 'major-arcana'
  },
  {
    id: 9,
    name: 'The Hermit',
    slug: 'the-hermit',
    image: BASE_IMAGE_URL + '/maj09.jpg',
    upright: 'Soul searching, introspection, being alone, inner guidance',
    reversed: 'Isolation, loneliness, withdrawal',
    element: null,
    zodiac: ['Saturn', 'Virgo', 'Capricorn'],
    keywords: ['the hermit tarot', 'hermit card meaning', 'introspection tarot', 'tarot hermit love', 'soul searching tarot', 'hermit tarot advice'],
    description: 'The Hermit represents the wisdom found in solitude and introspection. Through withdrawal from the outer world, we discover the inner light of truth and spiritual guidance.',
    category: 'major-arcana'
  },
  {
    id: 10,
    name: 'Wheel of Fortune',
    slug: 'wheel-of-fortune',
    image: BASE_IMAGE_URL + '/maj10.jpg',
    upright: 'Good luck, karma, life cycles, destiny, turning point',
    reversed: 'Bad luck, resistance to change, breaking cycles',
    element: null,
    zodiac: ['Jupiter', 'Sagittarius', 'Pisces'],
    keywords: ['wheel of fortune tarot', 'wheel of fortune meaning', 'karma tarot', 'tarot wheel fortune love', 'destiny tarot', 'luck tarot card'],
    description: 'The Wheel of Fortune reminds us that life is a cycle of constant change. What rises must fall, and what falls will rise again. This card represents destiny, karma, and the turning tides of fortune.',
    category: 'major-arcana'
  },
  {
    id: 11,
    name: 'Justice',
    slug: 'justice',
    image: BASE_IMAGE_URL + '/maj11.jpg',
    upright: 'Justice, fairness, truth, cause and effect, law',
    reversed: 'Unfairness, lack of accountability, dishonesty',
    element: null,
    zodiac: ['Libra', 'Venus'],
    keywords: ['justice tarot', 'justice card meaning', 'fairness tarot', 'tarot justice love', 'truth tarot', 'justice tarot career'],
    description: 'Justice represents the universal law of cause and effect. With clear sight and balanced scales, this card demands truth, accountability, and fair resolution of conflicts.',
    category: 'major-arcana'
  },
  {
    id: 12,
    name: 'The Hanged Man',
    slug: 'the-hanged-man',
    image: BASE_IMAGE_URL + '/maj12.jpg',
    upright: 'Pause, surrender, letting go, new perspectives',
    reversed: 'Delays, resistance, stalling, indecision',
    element: null,
    zodiac: ['Neptune', 'Pisces'],
    keywords: ['the hanged man tarot', 'hanged man meaning', 'surrender tarot', 'tarot hanged man love', 'new perspective tarot', 'hanged man advice'],
    description: 'The Hanged Man teaches wisdom through surrender and suspension. By willingly pausing and seeing from a new angle, we gain insights that action alone cannot provide.',
    category: 'major-arcana'
  },
  {
    id: 13,
    name: 'Death',
    slug: 'death',
    image: BASE_IMAGE_URL + '/maj13.jpg',
    upright: 'Endings, change, transformation, transition',
    reversed: 'Resistance to change, personal transformation, inner purging',
    element: null,
    zodiac: ['Scorpio', 'Pluto'],
    keywords: ['death tarot', 'death card meaning', 'transformation tarot', 'tarot death love', 'change tarot', 'death tarot explained'],
    description: 'Death represents the inevitable transformations that shape our lives. This card signals the end of one chapter and the birth of another, clearing the way for renewal and growth.',
    category: 'major-arcana'
  },
  {
    id: 14,
    name: 'Temperance',
    slug: 'temperance',
    image: BASE_IMAGE_URL + '/maj14.jpg',
    upright: 'Balance, moderation, patience, purpose, meaning',
    reversed: 'Imbalance, excess, self-healing, re-alignment',
    element: null,
    zodiac: ['Sagittarius', 'Jupiter'],
    keywords: ['temperance tarot', 'temperance card meaning', 'balance tarot', 'tarot temperance love', 'moderation tarot', 'temperance tarot advice'],
    description: 'Temperance represents the art of blending opposites into harmonious union. Through patience and moderation, we find the golden mean that brings healing and balanced flow.',
    category: 'major-arcana'
  },
  {
    id: 15,
    name: 'The Devil',
    slug: 'the-devil',
    image: BASE_IMAGE_URL + '/maj15.jpg',
    upright: 'Shadow self, attachment, addiction, restriction, sexuality',
    reversed: 'Releasing limiting beliefs, exploring dark thoughts, detachment',
    element: null,
    zodiac: ['Capricorn', 'Saturn'],
    keywords: ['the devil tarot', 'devil card meaning', 'addiction tarot', 'tarot devil love', 'shadow self tarot', 'devil tarot explained'],
    description: 'The Devil represents the chains we forge through attachment and desire. This card confronts us with our shadow self and the self-imposed limitations that keep us from true freedom.',
    category: 'major-arcana'
  },
  {
    id: 16,
    name: 'The Tower',
    slug: 'the-tower',
    image: BASE_IMAGE_URL + '/maj16.jpg',
    upright: 'Sudden change, upheaval, chaos, revelation, awakening',
    reversed: 'Personal transformation, fear of change, averting disaster',
    element: null,
    zodiac: ['Mars', 'Aries', 'Scorpio'],
    keywords: ['the tower tarot', 'tower card meaning', 'sudden change tarot', 'tarot tower love', 'chaos tarot', 'tower tarot explained'],
    description: 'The Tower represents sudden upheaval that shatters false foundations. While disruptive, this destruction clears the way for truth and authentic rebuilding on solid ground.',
    category: 'major-arcana'
  },
  {
    id: 17,
    name: 'The Star',
    slug: 'the-star',
    image: BASE_IMAGE_URL + '/maj17.jpg',
    upright: 'Hope, faith, purpose, renewal, spirituality',
    reversed: 'Lack of faith, despair, self-trust, disconnection',
    element: null,
    zodiac: ['Aquarius', 'Uranus'],
    keywords: ['the star tarot', 'star card meaning', 'hope tarot', 'tarot star love', 'renewal tarot', 'star tarot meaning'],
    description: 'The Star follows the storm as a beacon of hope and spiritual renewal. Naked and vulnerable before the universe, we find our place in the cosmos and trust in divine guidance.',
    category: 'major-arcana'
  },
  {
    id: 18,
    name: 'The Moon',
    slug: 'the-moon',
    image: BASE_IMAGE_URL + '/maj18.jpg',
    upright: 'Illusion, fear, anxiety, subconscious, intuition',
    reversed: 'Release of fear, repressed emotion, inner confusion',
    element: null,
    zodiac: ['Pisces', 'Neptune', 'Moon'],
    keywords: ['the moon tarot', 'moon card meaning', 'intuition tarot', 'tarot moon love', 'subconscious tarot', 'moon tarot explained'],
    description: 'The Moon illuminates the shadowy realm of dreams, fears, and intuition. In its mysterious light, we navigate the uncertain path between illusion and inner truth.',
    category: 'major-arcana'
  },
  {
    id: 19,
    name: 'The Sun',
    slug: 'the-sun',
    image: BASE_IMAGE_URL + '/maj19.jpg',
    upright: 'Positivity, fun, warmth, success, vitality',
    reversed: 'Inner child, feeling down, overly optimistic',
    element: null,
    zodiac: ['Sun', 'Leo'],
    keywords: ['the sun tarot', 'sun card meaning', 'happiness tarot', 'tarot sun love', 'success tarot', 'sun tarot card'],
    description: 'The Sun radiates joy, success, and the unbridled energy of life. In its warm light, all is revealed and blessed with the innocence and wonder of a child at play.',
    category: 'major-arcana'
  },
  {
    id: 20,
    name: 'Judgement',
    slug: 'judgement',
    image: BASE_IMAGE_URL + '/maj20.jpg',
    upright: 'Judgement, rebirth, inner calling, absolution',
    reversed: 'Self-doubt, inner critic, ignoring the call',
    element: null,
    zodiac: ['Pluto', 'Scorpio'],
    keywords: ['judgement tarot', 'judgement card meaning', 'rebirth tarot', 'tarot judgement love', 'awakening tarot', 'judgement tarot explained'],
    description: 'Judgement calls us to rise and answer our inner calling. Like the resurrection trumpet, this card announces a spiritual awakening and the absolution of past burdens.',
    category: 'major-arcana'
  },
  {
    id: 21,
    name: 'The World',
    slug: 'the-world',
    image: BASE_IMAGE_URL + '/maj21.jpg',
    upright: 'Completion, accomplishment, travel, achievement',
    reversed: 'Seeking personal closure, short-cuts, delays',
    element: null,
    zodiac: ['Saturn', 'Capricorn'],
    keywords: ['the world tarot', 'world card meaning', 'completion tarot', 'tarot world love', 'accomplishment tarot', 'world tarot card'],
    description: 'The World represents the completion of a major life cycle and the integration of all lessons learned. Having danced through the Major Arcana, we now hold the universe in our hands.',
    category: 'major-arcana'
  }
];

// Minor Arcana suits with element and zodiac associations
export const MINOR_ARCANA_ENRICHED = {
  wands: {
    suit: 'Wands',
    slug: 'wands',
    element: 'Fire',
    zodiac: ['Aries', 'Leo', 'Sagittarius'],
    keywords: ['wands tarot', 'fire suit tarot', 'wands suit meaning', 'tarot wands element', 'fire signs tarot'],
    description: 'The Suit of Wands represents fire energy, passion, creativity, and willpower. Associated with the fire signs Aries, Leo, and Sagittarius, Wands speak to our drive, ambition, and spiritual growth.',
    cards: [
      { id: 'w01', name: 'Ace of Wands', slug: 'ace-of-wands', image: BASE_IMAGE_URL + '/wands01.jpg', upright: 'Inspiration, new opportunities, growth, potential', reversed: 'An emerging idea, lack of direction, distractions, delays', keywords: ['ace of wands', 'ace wands tarot', 'new opportunity tarot', 'inspiration tarot', 'ace wands love'], description: 'The Ace of Wands is a spark of divine inspiration, a creative impulse that demands expression. This card signals new ventures, creative breakthroughs, and the fiery passion to begin.' },
      { id: 'w02', name: 'Two of Wands', slug: 'two-of-wands', image: BASE_IMAGE_URL + '/wands02.jpg', upright: 'Future planning, progress, decisions, discovery', reversed: 'Personal goals, inner alignment, fear of unknown, lack of planning', keywords: ['two of wands', 'two wands tarot', 'planning tarot', 'decisions tarot', 'two wands love'], description: 'The Two of Wands represents the planning stage of new ventures. Having begun the journey, we now survey the landscape and choose which path to follow into the future.' },
      { id: 'w03', name: 'Three of Wands', slug: 'three-of-wands', image: BASE_IMAGE_URL + '/wands03.jpg', upright: 'Progress, expansion, foresight, overseas opportunities', reversed: 'Playing small, lack of foresight, unexpected delays', keywords: ['three of wands', 'three wands tarot', 'expansion tarot', 'progress tarot', 'three wands love'], description: 'The Three of Wands shows the first fruits of our efforts and the vision to see further opportunities. Our ships are coming in, bringing rewards from ventures set in motion.' },
      { id: 'w04', name: 'Four of Wands', slug: 'four-of-wands', image: BASE_IMAGE_URL + '/wands04.jpg', upright: 'Celebration, joy, harmony, relaxation, homecoming', reversed: 'Personal celebration, inner harmony, conflict with others, transition', keywords: ['four of wands', 'four wands tarot', 'celebration tarot', 'harmony tarot', 'four wands love'], description: 'The Four of Wands celebrates milestones and the joy of community. This card represents weddings, housewarmings, and the stable foundations from which we can celebrate life with others.' },
      { id: 'w05', name: 'Five of Wands', slug: 'five-of-wands', image: BASE_IMAGE_URL + '/wands05.jpg', upright: 'Conflict, disagreements, competition, tension, diversity', reversed: 'Inner conflict, conflict avoidance, releasing tension', keywords: ['five of wands', 'five wands tarot', 'conflict tarot', 'competition tarot', 'five wands love'], description: 'The Five of Wands represents the clash of competing energies and opinions. Whether healthy competition or destructive conflict, this card challenges us to navigate tensions constructively.' },
      { id: 'w06', name: 'Six of Wands', slug: 'six-of-wands', image: BASE_IMAGE_URL + '/wands06.jpg', upright: 'Success, public recognition, progress, self-confidence', reversed: 'Private achievement, personal definition of success, fall from grace', keywords: ['six of wands', 'six wands tarot', 'victory tarot', 'recognition tarot', 'six wands love'], description: 'The Six of Wands celebrates public victory and recognition for our efforts. Riding high on the praise of others, we enjoy the confidence that comes from acknowledged achievement.' },
      { id: 'w07', name: 'Seven of Wands', slug: 'seven-of-wands', image: BASE_IMAGE_URL + '/wands07.jpg', upright: 'Challenge, competition, protection, perseverance', reversed: 'Exhaustion, giving up, overwhelmed', keywords: ['seven of wands', 'seven wands tarot', 'defense tarot', 'standing ground tarot', 'seven wands love'], description: 'The Seven of Wands shows us standing our ground against opposition. When others challenge what we have built, we must defend our position with courage and determination.' },
      { id: 'w08', name: 'Eight of Wands', slug: 'eight-of-wands', image: BASE_IMAGE_URL + '/wands08.jpg', upright: 'Movement, fast paced change, action, alignment, air travel', reversed: 'Delays, frustration, resisting change, internal alignment', keywords: ['eight of wands', 'eight wands tarot', 'movement tarot', 'quick action tarot', 'eight wands love'], description: 'The Eight of Wands brings swift movement and rapid progress. Like arrows flying toward their target, this card signals events unfolding quickly and messages arriving without delay.' },
      { id: 'w09', name: 'Nine of Wands', slug: 'nine-of-wands', image: BASE_IMAGE_URL + '/wands09.jpg', upright: 'Resilience, courage, persistence, test of faith, boundaries', reversed: 'Inner resources, struggle, overwhelm, defensive, paranoia', keywords: ['nine of wands', 'nine wands tarot', 'resilience tarot', 'perseverance tarot', 'nine wands love'], description: 'The Nine of Wands shows the wounded warrior who stands guard despite exhaustion. Having come through many battles, we must find one last reserve of strength to see things through.' },
      { id: 'w10', name: 'Ten of Wands', slug: 'ten-of-wands', image: BASE_IMAGE_URL + '/wands10.jpg', upright: 'Burden, extra responsibility, hard work, completion', reversed: 'Doing it all, carrying the burden, delegation, release', keywords: ['ten of wands', 'ten wands tarot', 'burden tarot', 'overwork tarot', 'ten wands love'], description: 'The Ten of Wands represents the weight of responsibility and the burden of success. Having achieved our goals, we may find ourselves overwhelmed by the obligations they bring.' },
      { id: 'w11', name: 'Page of Wands', slug: 'page-of-wands', image: BASE_IMAGE_URL + '/wands11.jpg', upright: 'Inspiration, ideas, discovery, limitless potential, free spirit', reversed: 'Newly-formed ideas, redirecting energy, self-limiting beliefs', keywords: ['page of wands', 'page wands tarot', 'messenger tarot', 'new ideas tarot', 'page wands love'], description: 'The Page of Wands brings news of exciting opportunities and creative inspiration. This messenger heralds the spark of a new passion or an invitation to adventure.' },
      { id: 'w12', name: 'Knight of Wands', slug: 'knight-of-wands', image: BASE_IMAGE_URL + '/wands12.jpg', upright: 'Energy, passion, inspired action, adventure, impulsiveness', reversed: 'Passion project, haste, scattered energy, delays, frustration', keywords: ['knight of wands', 'knight wands tarot', 'action tarot', 'adventure tarot', 'knight wands love'], description: 'The Knight of Wands charges forward with passionate energy and adventurous spirit. Impulsive and bold, this card represents the fire of action and the pursuit of our desires.' },
      { id: 'w13', name: 'Queen of Wands', slug: 'queen-of-wands', image: BASE_IMAGE_URL + '/wands13.jpg', upright: 'Courage, confidence, independence, social butterfly, determination', reversed: 'Self-respect, self-confidence, introverted, re-establish', keywords: ['queen of wands', 'queen wands tarot', 'confidence tarot', 'social tarot', 'queen wands love'], description: 'The Queen of Wands radiates confidence and magnetic charm. She combines the warmth of fire with practical wisdom, attracting others through her authentic self-assurance.' },
      { id: 'w14', name: 'King of Wands', slug: 'king-of-wands', image: BASE_IMAGE_URL + '/wands14.jpg', upright: 'Natural-born leader, vision, entrepreneur, honour', reversed: 'Impulsiveness, haste, ruthless, high expectations', keywords: ['king of wands', 'king wands tarot', 'leadership tarot', 'vision tarot', 'king wands love'], description: 'The King of Wands commands with visionary leadership and entrepreneurial fire. He has mastered the creative impulse and now leads others with charisma and strategic wisdom.' }
    ]
  },
  cups: {
    suit: 'Cups',
    slug: 'cups',
    element: 'Water',
    zodiac: ['Cancer', 'Scorpio', 'Pisces'],
    keywords: ['cups tarot', 'water suit tarot', 'cups suit meaning', 'tarot cups element', 'water signs tarot'],
    description: 'The Suit of Cups represents water energy, emotions, relationships, and intuition. Associated with the water signs Cancer, Scorpio, and Pisces, Cups flow through the realm of feelings, love, and spiritual connection.',
    cards: [
      { id: 'c01', name: 'Ace of Cups', slug: 'ace-of-cups', image: BASE_IMAGE_URL + '/cups01.jpg', upright: 'Love, new relationships, compassion, creativity', reversed: 'Self-love, intuition, repressed emotions', keywords: ['ace of cups', 'ace cups tarot', 'new love tarot', 'emotional awakening tarot', 'ace cups love'], description: 'The Ace of Cups overflows with divine love and emotional renewal. This card represents the source of pure feeling, spiritual connection, and the potential for deep emotional fulfillment.' },
      { id: 'c02', name: 'Two of Cups', slug: 'two-of-cups', image: BASE_IMAGE_URL + '/cups02.jpg', upright: 'Unified love, partnership, mutual attraction', reversed: 'Self-love, break-ups, disharmony, distrust', keywords: ['two of cups', 'two cups tarot', 'partnership tarot', 'soulmate tarot', 'two cups love'], description: 'The Two of Cups celebrates the union of two souls in mutual love and respect. Like the alchemical marriage of opposites, this card represents true partnership and emotional harmony.' },
      { id: 'c03', name: 'Three of Cups', slug: 'three-of-cups', image: BASE_IMAGE_URL + '/cups03.jpg', upright: 'Celebration, friendship, creativity, collaborations', reversed: 'Independence, alone time, hardcore partying, '''three'''s a crowd''', keywords: ['three of cups', 'three cups tarot', 'friendship tarot', 'celebration tarot', 'three cups love'], description: 'The Three of Cups rejoices in the joy of community and shared celebration. Friends gather to support, celebrate, and create together, finding joy in emotional connection.' },
      { id: 'c04', name: 'Four of Cups', slug: 'four-of-cups', image: BASE_IMAGE_URL + '/cups04.jpg', upright: 'Meditation, contemplation, apathy, reevaluation', reversed: 'Retreat, withdrawal, checking in for alignment', keywords: ['four of cups', 'four cups tarot', 'contemplation tarot', 'boredom tarot', 'four cups love'], description: 'The Four of Cups represents emotional contemplation and the search for deeper meaning. Discontent with surface pleasures, we turn inward to find what truly satisfies the soul.' },
      { id: 'c05', name: 'Five of Cups', slug: 'five-of-cups', image: BASE_IMAGE_URL + '/cups05.jpg', upright: 'Regret, failure, disappointment, pessimism', reversed: 'Personal setbacks, self-forgiveness, moving on', keywords: ['five of cups', 'five cups tarot', 'grief tarot', 'loss tarot', 'five cups love'], description: 'The Five of Cups mourns what has been lost while overlooking what remains. This card acknowledges grief and disappointment while reminding us that not all is lost if we turn around.' },
      { id: 'c06', name: 'Six of Cups', slug: 'six-of-cups', image: BASE_IMAGE_URL + '/cups06.jpg', upright: 'Revisiting the past, childhood memories, innocence, joy', reversed: 'Living in the past, forgiveness, lacking playfulness', keywords: ['six of cups', 'six cups tarot', 'nostalgia tarot', 'childhood tarot', 'six cups love'], description: 'The Six of Cups returns to the innocence of childhood and the sweetness of nostalgia. Memories, old friends, and past experiences resurface to teach or bring joy.' },
      { id: 'c07', name: 'Seven of Cups', slug: 'seven-of-cups', image: BASE_IMAGE_URL + '/cups07.jpg', upright: 'Opportunities, choices, wishful thinking, illusion', reversed: 'Alignment, personal values, overwhelmed by choices', keywords: ['seven of cups', 'seven cups tarot', 'choices tarot', 'illusions tarot', 'seven cups love'], description: 'The Seven of Cups presents many tempting options, but not all are what they appear. This card warns of illusions and fantasies while inviting us to choose with clear eyes.' },
      { id: 'c08', name: 'Eight of Cups', slug: 'eight-of-cups', image: BASE_IMAGE_URL + '/cups08.jpg', upright: 'Disappointment, abandonment, withdrawal, escapism', reversed: 'Trying one more time, indecision, aimless drifting, walking away', keywords: ['eight of cups', 'eight cups tarot', 'walking away tarot', 'seeking meaning tarot', 'eight cups love'], description: 'The Eight of Cups shows the difficult decision to leave something behind in search of deeper meaning. Sometimes we must abandon what we have to find what we truly need.' },
      { id: 'c09', name: 'Nine of Cups', slug: 'nine-of-cups', image: BASE_IMAGE_URL + '/cups09.jpg', upright: 'Contentment, satisfaction, gratitude, wish come true', reversed: 'Inner happiness, materialism, dissatisfaction, indulgence', keywords: ['nine of cups', 'nine cups tarot', 'wish fulfillment tarot', 'contentment tarot', 'nine cups love'], description: 'The Nine of Cups represents emotional satisfaction and the fulfillment of heartfelt wishes. Known as the wish card, it signals contentment, gratitude, and dreams coming true.' },
      { id: 'c10', name: 'Ten of Cups', slug: 'ten-of-cups', image: BASE_IMAGE_URL + '/cups10.jpg', upright: 'Divine love, blissful relationships, harmony, alignment', reversed: 'Disconnection, misaligned values, struggling relationships', keywords: ['ten of cups', 'ten cups tarot', 'family harmony tarot', 'divine love tarot', 'ten cups love'], description: 'The Ten of Cups overflows with emotional bliss and harmonious family connections. This card represents the ultimate in emotional fulfillment, happy homes, and blessed unions.' },
      { id: 'c11', name: 'Page of Cups', slug: 'page-of-cups', image: BASE_IMAGE_URL + '/cups11.jpg', upright: 'Creative opportunities, intuitive messages, curiosity, possibility', reversed: 'New ideas, doubting intuition, creative blocks, emotional immaturity', keywords: ['page of cups', 'page cups tarot', 'message tarot', 'intuition tarot', 'page cups love'], description: 'The Page of Cups brings intuitive messages and creative inspiration. This messenger heralds emotional news, artistic opportunities, and the awakening of psychic sensitivity.' },
      { id: 'c12', name: 'Knight of Cups', slug: 'knight-of-cups', image: BASE_IMAGE_URL + '/cups12.jpg', upright: 'Creativity, romance, charm, imagination, beauty', reversed: 'Overactive imagination, unrealistic, jealous, moody', keywords: ['knight of cups', 'knight cups tarot', 'romance tarot', 'charm tarot', 'knight cups love'], description: 'The Knight of Cups rides forth on a quest for love and beauty. Romantic, artistic, and idealistic, this card represents the pursuit of emotional dreams and creative visions.' },
      { id: 'c13', name: 'Queen of Cups', slug: 'queen-of-cups', image: BASE_IMAGE_URL + '/cups13.jpg', upright: 'Compassionate, caring, emotionally stable, intuitive, in flow', reversed: 'Inner feelings, self-care, self-love, co-dependency', keywords: ['queen of cups', 'queen cups tarot', 'intuition tarot', 'compassion tarot', 'queen cups love'], description: 'The Queen of Cups embodies emotional intelligence and intuitive wisdom. She listens to the whispers of the heart and offers compassionate understanding to all who seek her counsel.' },
      { id: 'c14', name: 'King of Cups', slug: 'king-of-cups', image: BASE_IMAGE_URL + '/cups14.jpg', upright: 'Emotionally balanced, compassionate, diplomatic', reversed: 'Self-compassion, inner feelings, moodiness, emotionally manipulative', keywords: ['king of cups', 'king cups tarot', 'emotional mastery tarot', 'diplomacy tarot', 'king cups love'], description: 'The King of Cups has mastered the realm of emotions without being ruled by them. Diplomatic, compassionate, and wise, he offers mature guidance through emotional waters.' }
    ]
  },
  swords: {
    suit: 'Swords',
    slug: 'swords',
    element: 'Air',
    zodiac: ['Gemini', 'Libra', 'Aquarius'],
    keywords: ['swords tarot', 'air suit tarot', 'swords suit meaning', 'tarot swords element', 'air signs tarot'],
    description: 'The Suit of Swords represents air energy, intellect, communication, and mental clarity. Associated with the air signs Gemini, Libra, and Aquarius, Swords cut through confusion to reveal truth and logic.',
    cards: [
      { id: 's01', name: 'Ace of Swords', slug: 'ace-of-swords', image: BASE_IMAGE_URL + '/swords01.jpg', upright: 'Breakthroughs, new ideas, mental clarity, success', reversed: 'Inner clarity, re-thinking an idea, clouded judgement', keywords: ['ace of swords', 'ace swords tarot', 'mental clarity tarot', 'breakthrough tarot', 'ace swords love'], description: 'The Ace of Swords represents the clarity of pure intellect and the power of truth. Like a sword cutting through darkness, this card brings mental breakthroughs and new understanding.' },
      { id: 's02', name: 'Two of Swords', slug: 'two-of-swords', image: BASE_IMAGE_URL + '/swords02.jpg', upright: 'Difficult decisions, weighing up options, an impasse, avoidance', reversed: 'Indecision, confusion, information overload, stalemate', keywords: ['two of swords', 'two swords tarot', 'decision tarot', 'impasse tarot', 'two swords love'], description: 'The Two of Swords shows the difficulty of choosing between equally valid options. Blinded by indecision, we must remove the veil and face the truth to move forward.' },
      { id: 's03', name: 'Three of Swords', slug: 'three-of-swords', image: BASE_IMAGE_URL + '/swords03.jpg', upright: 'Heartbreak, emotional pain, sorrow, grief, hurt', reversed: 'Negative self-talk, releasing pain, optimism, forgiveness', keywords: ['three of swords', 'three swords tarot', 'heartbreak tarot', 'grief tarot', 'three swords love'], description: 'The Three of Swords represents the piercing pain of loss and sorrow. Like storm clouds releasing rain, this card acknowledges grief as necessary for healing and renewal.' },
      { id: 's04', name: 'Four of Swords', slug: 'four-of-swords', image: BASE_IMAGE_URL + '/swords04.jpg', upright: 'Rest, relaxation, meditation, contemplation, recuperation', reversed: 'Exhaustion, burn-out, deep contemplation, stagnation', keywords: ['four of swords', 'four swords tarot', 'rest tarot', 'meditation tarot', 'four swords love'], description: 'The Four of Swords offers respite from mental strain through rest and contemplation. In stillness, we recuperate our strength and gain the clarity that action alone cannot provide.' },
      { id: 's05', name: 'Five of Swords', slug: 'five-of-swords', image: BASE_IMAGE_URL + '/swords05.jpg', upright: 'Conflict, disagreements, competition, defeat, winning at all costs', reversed: 'Reconciliation, making amends, past resentment', keywords: ['five of swords', 'five swords tarot', 'conflict tarot', 'defeat tarot', 'five swords love'], description: 'The Five of Swords represents conflict and the hollow victory of winning at any cost. Sometimes the price of victory is too high, leaving only empty triumph and lost trust.' },
      { id: 's06', name: 'Six of Swords', slug: 'six-of-swords', image: BASE_IMAGE_URL + '/swords06.jpg', upright: 'Transition, change, rite of passage, releasing baggage', reversed: 'Personal transition, resistance to change, unfinished business', keywords: ['six of swords', 'six swords tarot', 'transition tarot', 'moving on tarot', 'six swords love'], description: 'The Six of Swords represents the journey from troubled waters to calmer shores. Moving away from difficulties, we travel toward healing and leave behind what no longer serves us.' },
      { id: 's07', name: 'Seven of Swords', slug: 'seven-of-swords', image: BASE_IMAGE_URL + '/swords07.jpg', upright: 'Betrayal, deception, getting away with something, acting strategically', reversed: 'Imposter syndrome, self-deceit, keeping secrets', keywords: ['seven of swords', 'seven swords tarot', 'deception tarot', 'strategy tarot', 'seven swords love'], description: 'The Seven of Swords suggests stealth, strategy, and the possibility of deception. Whether clever tactics or dishonest behavior depends on intention and the price of secrecy.' },
      { id: 's08', name: 'Eight of Swords', slug: 'eight-of-swords', image: BASE_IMAGE_URL + '/swords08.jpg', upright: 'Negative thoughts, self-imposed restriction, imprisonment, victim mentality', reversed: 'Self-limiting beliefs, inner critic, releasing negative thoughts, open to new perspectives', keywords: ['eight of swords', 'eight swords tarot', 'restriction tarot', 'negative thoughts tarot', 'eight swords love'], description: 'The Eight of Swords represents the prison of our own negative thoughts and beliefs. Bound by fear and self-doubt, we fail to see that the way out is closer than we imagine.' },
      { id: 's09', name: 'Nine of Swords', slug: 'nine-of-swords', image: BASE_IMAGE_URL + '/swords09.jpg', upright: 'Anxiety, worry, fear, depression, nightmares', reversed: 'Inner turmoil, deep-seated fears, secrets, releasing worry', keywords: ['nine of swords', 'nine swords tarot', 'anxiety tarot', 'worry tarot', 'nine swords love'], description: 'The Nine of Swords represents the torment of anxiety and the demons of the mind. In the dark night of the soul, we face our deepest fears and the weight of overwhelming worry.' },
      { id: 's10', name: 'Ten of Swords', slug: 'ten-of-swords', image: BASE_IMAGE_URL + '/swords10.jpg', upright: 'Painful endings, deep wounds, betrayal, loss, crisis', reversed: 'Recovery, regeneration, resisting an inevitable end', keywords: ['ten of swords', 'ten swords tarot', 'rock bottom tarot', 'ending tarot', 'ten swords love'], description: 'The Ten of Swords represents painful endings and betrayal that cut to the core. Yet even in this darkest moment, the dawn is breaking, and regeneration will follow destruction.' },
      { id: 's11', name: 'Page of Swords', slug: 'page-of-swords', image: BASE_IMAGE_URL + '/swords11.jpg', upright: 'New ideas, curiosity, thirst for knowledge, new ways of communicating', reversed: 'Self-expression, all talk and no action, haphazard action, haste', keywords: ['page of swords', 'page swords tarot', 'curiosity tarot', 'new ideas tarot', 'page swords love'], description: 'The Page of Swords brings new ideas and intellectual curiosity. This messenger heralds mental stimulation, important news, and the youthful energy of exploring new concepts.' },
      { id: 's12', name: 'Knight of Swords', slug: 'knight-of-swords', image: BASE_IMAGE_URL + '/swords12.jpg', upright: 'Ambitious, action-oriented, driven to succeed, fast-thinking', reversed: 'Restless, unfocused, impulsive, burn-out', keywords: ['knight of swords', 'knight swords tarot', 'action tarot', 'ambition tarot', 'knight swords love'], description: 'The Knight of Swords charges ahead with intellectual determination and swift action. Driven by ideas and ambition, he pursues his goals with single-minded intensity.' },
      { id: 's13', name: 'Queen of Swords', slug: 'queen-of-swords', image: BASE_IMAGE_URL + '/swords13.jpg', upright: 'Independent, unbiased judgement, clear boundaries, direct communication', reversed: 'Overly-emotional, easily influenced, bitchy, cold-hearted', keywords: ['queen of swords', 'queen swords tarot', 'clear thinking tarot', 'independence tarot', 'queen swords love'], description: 'The Queen of Swords embodies intellectual clarity and honest communication. She cuts through deception with her sword of truth, offering wisdom unclouded by emotion.' },
      { id: 's14', name: 'King of Swords', slug: 'king-of-swords', image: BASE_IMAGE_URL + '/swords14.jpg', upright: 'Mental clarity, intellectual power, authority, truth', reversed: 'Quiet power, inner truth, misuse of power, manipulation', keywords: ['king of swords', 'king swords tarot', 'authority tarot', 'truth tarot', 'king swords love'], description: 'The King of Swords commands the realm of intellect with authority and truth. Analytical, fair, and articulate, he makes decisions based on logic and ethical principle.' }
    ]
  },
  pentacles: {
    suit: 'Pentacles',
    slug: 'pentacles',
    element: 'Earth',
    zodiac: ['Taurus', 'Virgo', 'Capricorn'],
    keywords: ['pentacles tarot', 'earth suit tarot', 'pentacles suit meaning', 'tarot pentacles element', 'earth signs tarot'],
    description: 'The Suit of Pentacles represents earth energy, material world, money, and physical health. Associated with the earth signs Taurus, Virgo, and Capricorn, Pentacles ground us in practical reality and manifestation.',
    cards: [
      { id: 'p01', name: 'Ace of Pentacles', slug: 'ace-of-pentacles', image: BASE_IMAGE_URL + '/pents01.jpg', upright: 'A new financial or career opportunity, manifestation, abundance', reversed: 'Lost opportunity, lack of planning, poor financial decisions', keywords: ['ace of pentacles', 'ace pentacles tarot', 'new opportunity tarot', 'manifestation tarot', 'ace pentacles love'], description: 'The Ace of Pentacles represents the seed of material abundance and practical opportunity. Like a golden coin offered from the heavens, this card signals new financial prospects and tangible blessings.' },
      { id: 'p02', name: 'Two of Pentacles', slug: 'two-of-pentacles', image: BASE_IMAGE_URL + '/pents02.jpg', upright: 'Multiple priorities, time management, prioritisation, adaptability', reversed: 'Over-committed, disorganisation, reprioritisation', keywords: ['two of pentacles', 'two pentacles tarot', 'balance tarot', 'juggling tarot', 'two pentacles love'], description: 'The Two of Pentacles shows the dance of balancing multiple responsibilities. With adaptability and grace, we juggle competing priorities while maintaining our equilibrium.' },
      { id: 'p03', name: 'Three of Pentacles', slug: 'three-of-pentacles', image: BASE_IMAGE_URL + '/pents03.jpg', upright: 'Teamwork, collaboration, learning, implementation', reversed: 'Disharmony, misalignment, working alone', keywords: ['three of pentacles', 'three pentacles tarot', 'teamwork tarot', 'collaboration tarot', 'three pentacles love'], description: 'The Three of Pentacles celebrates skilled craftsmanship and collaborative success. Through teamwork and shared expertise, we build something greater than any individual could create alone.' },
      { id: 'p04', name: 'Four of Pentacles', slug: 'four-of-pentacles', image: BASE_IMAGE_URL + '/pents04.jpg', upright: 'Saving money, security, conservatism, scarcity, control', reversed: 'Over-spending, greed, self-protection', keywords: ['four of pentacles', 'four pentacles tarot', 'security tarot', 'possessiveness tarot', 'four pentacles love'], description: 'The Four of Pentacles represents the desire for financial security and material control. While prudence is wise, clinging too tightly to possessions can become its own prison.' },
      { id: 'p05', name: 'Five of Pentacles', slug: 'five-of-pentacles', image: BASE_IMAGE_URL + '/pents05.jpg', upright: 'Financial loss, poverty, lack mindset, isolation, worry', reversed: 'Recovery from financial loss, spiritual poverty', keywords: ['five of pentacles', 'five pentacles tarot', 'financial hardship tarot', 'loss tarot', 'five pentacles love'], description: 'The Five of Pentacles represents material hardship and the feeling of being left out in the cold. Yet even in difficult times, help and warmth are available if we seek them.' },
      { id: 'p06', name: 'Six of Pentacles', slug: 'six-of-pentacles', image: BASE_IMAGE_URL + '/pents06.jpg', upright: 'Giving, receiving, sharing wealth, generosity, charity', reversed: 'Self-care, unpaid debts, one-sided charity', keywords: ['six of pentacles', 'six pentacles tarot', 'generosity tarot', 'giving tarot', 'six pentacles love'], description: 'The Six of Pentacles represents the balanced flow of giving and receiving. Whether sharing abundance or graciously accepting help, this card speaks to the circulation of material blessings.' },
      { id: 'p07', name: 'Seven of Pentacles', slug: 'seven-of-pentacles', image: BASE_IMAGE_URL + '/pents07.jpg', upright: 'Long-term view, sustainable results, perseverance, investment', reversed: 'Lack of long-term vision, limited success, question worth', keywords: ['seven of pentacles', 'seven pentacles tarot', 'patience tarot', 'investment tarot', 'seven pentacles love'], description: 'The Seven of Pentacles shows the moment of assessment after long labor. Pausing to evaluate our progress, we decide whether to continue investing our energy or change course.' },
      { id: 'p08', name: 'Eight of Pentacles', slug: 'eight-of-pentacles', image: BASE_IMAGE_URL + '/pents08.jpg', upright: 'Apprenticeship, repetitive tasks, mastery, skill development', reversed: 'Self-development, perfectionism, misdirected activity', keywords: ['eight of pentacles', 'eight pentacles tarot', 'mastery tarot', 'apprenticeship tarot', 'eight pentacles love'], description: 'The Eight of Pentacles represents dedication to craft and the pursuit of excellence. Through focused practice and attention to detail, we develop true mastery in our chosen skills.' },
      { id: 'p09', name: 'Nine of Pentacles', slug: 'nine-of-pentacles', image: BASE_IMAGE_URL + '/pents09.jpg', upright: 'Abundance, luxury, self-sufficiency, financial independence', reversed: 'Self-worth, over-investment in work, hustling', keywords: ['nine of pentacles', 'nine pentacles tarot', 'luxury tarot', 'independence tarot', 'nine pentacles love'], description: 'The Nine of Pentacles celebrates the fruits of self-made success and refined taste. Enjoying the abundance earned through our own efforts, we savor luxury and independence.' },
      { id: 'p10', name: 'Ten of Pentacles', slug: 'ten-of-pentacles', image: BASE_IMAGE_URL + '/pents10.jpg', upright: 'Wealth, financial security, family, long-term success, contribution', reversed: 'The dark side of wealth, financial failure, loneliness', keywords: ['ten of pentacles', 'ten pentacles tarot', 'legacy tarot', 'family wealth tarot', 'ten pentacles love'], description: 'The Ten of Pentacles represents lasting wealth, family legacy, and the culmination of material success. This card speaks to the abundance that supports not just ourselves but generations to come.' },
      { id: 'p11', name: 'Page of Pentacles', slug: 'page-of-pentacles', image: BASE_IMAGE_URL + '/pents11.jpg', upright: 'Manifestation, financial opportunity, skill development, ambition', reversed: 'Lack of progress, procrastination, learn from failure', keywords: ['page of pentacles', 'page pentacles tarot', 'opportunity tarot', 'manifestation tarot', 'page pentacles love'], description: 'The Page of Pentacles brings news of material opportunities and new ventures. This messenger heralds practical prospects, educational pursuits, and the potential for tangible growth.' },
      { id: 'p12', name: 'Knight of Pentacles', slug: 'knight-of-pentacles', image: BASE_IMAGE_URL + '/pents12.jpg', upright: 'Hard work, productivity, routine, conservatism, methodical', reversed: 'Self-discipline, boredom, feeling '''stuck''', perfectionism', keywords: ['knight of pentacles', 'knight pentacles tarot', 'diligence tarot', 'responsibility tarot', 'knight pentacles love'], description: 'The Knight of Pentacles represents steady, methodical progress toward practical goals. Slow but sure, this diligent worker builds lasting success through persistence and attention to detail.' },
      { id: 'p13', name: 'Queen of Pentacles', slug: 'queen-of-pentacles', image: BASE_IMAGE_URL + '/pents13.jpg', upright: 'Nurturing, practical, providing financially, a working parent, grounded', reversed: 'Financial independence, self-care, work-home conflict', keywords: ['queen of pentacles', 'queen pentacles tarot', 'nurturing tarot', 'practical tarot', 'queen pentacles love'], description: 'The Queen of Pentacles embodies nurturing abundance and practical wisdom. She creates comfortable, beautiful environments while managing material resources with natural grace.' },
      { id: 'p14', name: 'King of Pentacles', slug: 'king-of-pentacles', image: BASE_IMAGE_URL + '/pents14.jpg', upright: 'Wealth, business, leadership, security, discipline, abundance', reversed: 'Financially inept, obsessed with wealth, stubborn, greed', keywords: ['king of pentacles', 'king pentacles tarot', 'business tarot', 'abundance tarot', 'king pentacles love'], description: 'The King of Pentacles commands the realm of material success and business acumen. Disciplined, generous, and grounded, he has mastered the art of creating and managing wealth.' }
    ]
  }
};

// Combine all cards for full deck
export const ALL_CARDS_ENRICHED = [
  ...MAJOR_ARCANA_ENRICHED,
  ...MINOR_ARCANA_ENRICHED.wands.cards,
  ...MINOR_ARCANA_ENRICHED.cups.cards,
  ...MINOR_ARCANA_ENRICHED.swords.cards,
  ...MINOR_ARCANA_ENRICHED.pentacles.cards
];

// Helper functions for PSEO

export function getCardBySlug(slug) {
  return ALL_CARDS_ENRICHED.find(card => card.slug === slug.toLowerCase());
}

export function getCardByName(name) {
  return ALL_CARDS_ENRICHED.find(card => card.name.toLowerCase() === name.toLowerCase());
}

export function getCardsByElement(element) {
  const results = [];
  // Major Arcana
  results.push(...MAJOR_ARCANA_ENRICHED.filter(card => card.zodiac?.some(z => z.toLowerCase() === element.toLowerCase())));
  // Minor Arcana
  Object.values(MINOR_ARCANA_ENRICHED).forEach(suit => {
    if (suit.element.toLowerCase() === element.toLowerCase()) {
      results.push(...suit.cards);
    }
  });
  return results;
}

export function getCardsByZodiacSign(sign) {
  return ALL_CARDS_ENRICHED.filter(card => 
    card.zodiac?.some(z => z.toLowerCase() === sign.toLowerCase())
  );
}

export function getSuitData(suitName) {
  return MINOR_ARCANA_ENRICHED[suitName.toLowerCase()] || null;
}

export function getAllCardSlugs() {
  return ALL_CARDS_ENRICHED.map(card => card.slug);
}

export function getAllSuitSlugs() {
  return Object.values(MINOR_ARCANA_ENRICHED).map(suit => suit.slug);
}

// Export for backward compatibility
export { MAJOR_ARCANA_ENRICHED as MAJOR_ARCANA };
export { MINOR_ARCANA_ENRICHED as MINOR_ARCANA };
export { ALL_CARDS_ENRICHED as ALL_CARDS };
export { ALL_CARDS_ENRICHED as enriched };

// Re-export from original tarot-data for compatibility
export function drawCards(count = 3) {
  const deck = [...ALL_CARDS_ENRICHED];
  const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 1;
  if (deck.length < safeCount) {
    console.error('Invalid deck or not enough cards to draw', { requested: safeCount, available: deck.length });
    return [];
  }
  const shuffled = deck.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, safeCount).map(card => ({
    ...card,
    reversed: Math.random() > 0.5
  }));
}
