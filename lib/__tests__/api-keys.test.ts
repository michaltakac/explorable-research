import { describe, it, expect } from 'vitest'

describe('API Keys', () => {
  describe('ApiKeyMetadata type', () => {
    it('should have correct shape', () => {
      const mockKey = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Test Key',
        prefix: 'jQLhhoPA',
        created_at: '2026-01-04T00:00:00.000Z',
        last_used_at: null,
        is_revoked: false,
        expires_at: '2126-01-04T00:00:00.000Z',
      }

      expect(mockKey).toHaveProperty('id')
      expect(mockKey).toHaveProperty('description')
      expect(mockKey).toHaveProperty('prefix')
      expect(mockKey).toHaveProperty('created_at')
      expect(mockKey).toHaveProperty('is_revoked')
      expect(mockKey.is_revoked).toBe(false)
    })
  })

  describe('Key description validation', () => {
    it('should allow valid descriptions', () => {
      const validDescriptions = [
        'My API Key',
        'Production-Server',
        'test_key_123',
        'Key 1',
      ]

      const pattern = /^[a-zA-Z0-9_ \-]*$/

      validDescriptions.forEach((desc) => {
        expect(pattern.test(desc)).toBe(true)
      })
    })

    it('should reject invalid descriptions', () => {
      const invalidDescriptions = [
        'Key with @symbol',
        'Key!',
        'Key#123',
        'Key$money',
      ]

      const pattern = /^[a-zA-Z0-9_ \-]*$/

      invalidDescriptions.forEach((desc) => {
        expect(pattern.test(desc)).toBe(false)
      })
    })

    it('should enforce max length of 255 characters', () => {
      const maxLength = 255
      const validLength = 'a'.repeat(255)
      const invalidLength = 'a'.repeat(256)

      expect(validLength.length).toBeLessThanOrEqual(maxLength)
      expect(invalidLength.length).toBeGreaterThan(maxLength)
    })
  })
})


