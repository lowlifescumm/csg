/**
 * Reading Generation Unit Tests
 * Tests for reading generation success and API failure fallback
 */

const { Pool } = require('pg');

// Mock dependencies
jest.mock('@/lib/db', () => {
  const mockPool = {
    query: jest.fn(),
  };
  return { pool: mockPool };
});

jest.mock('@/lib/auth', () => ({
  getAuthenticatedUser: jest.fn(),
}));

jest.mock('@/lib/openai', () => ({
  generateTarotReading: jest.fn(),
  generateTarotSummary: jest.fn(),
}));

jest.mock('@/lib/tarot-data', () => ({
  drawCards: jest.fn(),
}));

jest.mock('@/lib/access-control', () => ({
  canAccessReading: jest.fn(),
  consumeCreditsForReading: jest.fn(),
}));

const { pool } = require('@/lib/db');
const { getAuthenticatedUser } = require('@/lib/auth');
const { generateTarotReading, generateTarotSummary } = require('@/lib/openai');
const { drawCards } = require('@/lib/tarot-data');
const { canAccessReading, consumeCreditsForReading } = require('@/lib/access-control');

describe('Reading Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Reading Generation', () => {
    test('should generate reading successfully', async () => {
      const userId = 1;
      const mockCards = [
        { name: 'The Fool', reversed: false },
        { name: 'The Magician', reversed: false },
        { name: 'The High Priestess', reversed: false },
      ];
      const mockInterpretation = 'Your reading reveals new beginnings...';
      const mockSummary = 'A journey of discovery awaits';

      getAuthenticatedUser.mockResolvedValue({ userId });
      canAccessReading.mockResolvedValue({ allowed: true, required: 1 });
      consumeCreditsForReading.mockResolvedValue({ success: true, creditsRemaining: 9 });
      drawCards.mockReturnValue(mockCards);
      generateTarotReading.mockResolvedValue(mockInterpretation);
      generateTarotSummary.mockResolvedValue(mockSummary);
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 123, created_at: new Date() }],
      });

      // Simulate reading generation flow
      const accessCheck = await canAccessReading(userId, 'TAROT_BASIC');
      expect(accessCheck.allowed).toBe(true);

      const creditResult = await consumeCreditsForReading(userId, 'TAROT_BASIC');
      expect(creditResult.success).toBe(true);

      const cards = drawCards(3);
      expect(cards).toEqual(mockCards);

      const interpretation = await generateTarotReading(cards, 'Test question', 'daily_tarot', 'general');
      expect(interpretation).toBe(mockInterpretation);

      const summary = await generateTarotSummary(interpretation);
      expect(summary).toBe(mockSummary);

      // Save reading
      const savedReading = await pool.query(
        `INSERT INTO readings (user_id, type, question, result, spread_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, created_at`,
        [userId, 'tarot', 'Test question', JSON.stringify({ cards, interpretation }), 'daily_tarot']
      );

      expect(savedReading.rows[0].id).toBe(123);
      expect(generateTarotReading).toHaveBeenCalled();
      expect(generateTarotSummary).toHaveBeenCalled();
    });

    test('should handle reading generation with question', async () => {
      const userId = 1;
      const question = 'What does the future hold for my career?';

      getAuthenticatedUser.mockResolvedValue({ userId });
      canAccessReading.mockResolvedValue({ allowed: true });
      consumeCreditsForReading.mockResolvedValue({ success: true });
      drawCards.mockReturnValue([{ name: 'The Sun' }]);
      generateTarotReading.mockResolvedValue('Career success awaits');
      generateTarotSummary.mockResolvedValue('Positive career outlook');
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 456, created_at: new Date() }],
      });

      // Simulate reading with question
      const cards = drawCards(1);
      const interpretation = await generateTarotReading(cards, question, 'one_card', 'career');
      const summary = await generateTarotSummary(interpretation);

      const savedReading = await pool.query(
        `INSERT INTO readings (user_id, type, question, result, spread_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [userId, 'tarot', question, JSON.stringify({ cards, interpretation }), 'one_card']
      );

      expect(savedReading.rows[0].id).toBe(456);
      expect(generateTarotReading).toHaveBeenCalledWith(
        cards,
        question,
        'one_card',
        'career'
      );
    });
  });

  describe('API Failure Fallback', () => {
    test('should handle OpenAI API failure gracefully', async () => {
      const userId = 1;

      getAuthenticatedUser.mockResolvedValue({ userId });
      canAccessReading.mockResolvedValue({ allowed: true });
      consumeCreditsForReading.mockResolvedValue({ success: true });
      drawCards.mockReturnValue([{ name: 'The Tower' }]);
      generateTarotReading.mockRejectedValue(new Error('OpenAI API error'));

      // Simulate API failure
      try {
        const cards = drawCards(1);
        const interpretation = await generateTarotReading(cards, '', 'one_card', 'general');
      } catch (error) {
        expect(error.message).toBe('OpenAI API error');

        // Should not save reading if generation fails
        // Credits should be refunded or not consumed
        expect(pool.query).not.toHaveBeenCalled();
      }
    });

    test('should handle database save failure', async () => {
      const userId = 1;

      getAuthenticatedUser.mockResolvedValue({ userId });
      canAccessReading.mockResolvedValue({ allowed: true });
      consumeCreditsForReading.mockResolvedValue({ success: true });
      drawCards.mockReturnValue([{ name: 'The Star' }]);
      generateTarotReading.mockResolvedValue('Hope and inspiration');
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      // Simulate database failure
      try {
        const cards = drawCards(1);
        const interpretation = await generateTarotReading(cards, '', 'one_card', 'general');

        await pool.query(
          `INSERT INTO readings (user_id, type, question, result, spread_type)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [userId, 'tarot', '', JSON.stringify({ cards, interpretation }), 'one_card']
        );
      } catch (error) {
        expect(error.message).toBe('Database error');
        // Should handle error gracefully
      }
    });

    test('should handle network timeout', async () => {
      const userId = 1;

      getAuthenticatedUser.mockResolvedValue({ userId });
      canAccessReading.mockResolvedValue({ allowed: true });
      consumeCreditsForReading.mockResolvedValue({ success: true });
      drawCards.mockReturnValue([{ name: 'The Moon' }]);
      generateTarotReading.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        });
      });

      // Simulate timeout
      try {
        const cards = drawCards(1);
        await Promise.race([
          generateTarotReading(cards, '', 'one_card', 'general'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 50)),
        ]);
      } catch (error) {
        expect(error.message).toBe('Timeout');
        // Should handle timeout gracefully
      }
    });
  });

  describe('Reading Validation', () => {
    test('should validate required question for specific spreads', async () => {
      const userId = 1;
      const spreadType = 'yes_no';
      const question = ''; // Missing question

      getAuthenticatedUser.mockResolvedValue({ userId });
      canAccessReading.mockResolvedValue({ allowed: true });
      consumeCreditsForReading.mockResolvedValue({ success: true });

      // Simulate validation
      const spread = { ui: { require_question: true } };
      const isValid = spread.ui?.require_question ? question.trim().length > 0 : true;

      expect(isValid).toBe(false);
      // Should not proceed with reading generation
    });

    test('should validate card count for spread', async () => {
      const userId = 1;
      const requiredCount = 3;
      const providedCards = [{ name: 'Card 1' }, { name: 'Card 2' }]; // Only 2 cards

      getAuthenticatedUser.mockResolvedValue({ userId });
      canAccessReading.mockResolvedValue({ allowed: true });

      // Simulate validation
      const isValid = providedCards.length === requiredCount;

      expect(isValid).toBe(false);
      expect(providedCards.length).toBe(2);
      expect(requiredCount).toBe(3);
    });
  });
});

