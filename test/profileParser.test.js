import { describe, it, expect } from 'vitest';
import { parseProfileResponse } from '../lib/profileParser.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadFixture(name) {
  const fixturePath = path.join(__dirname, 'fixtures', name);
  return fs.readFileSync(fixturePath, 'utf-8');
}

describe('parseProfileResponse', () => {
  describe('basic profiles', () => {
    it('should parse English profile with 100M+ format', () => {
      const response = loadFixture('profile-basic-en.txt');
      const result = parseProfileResponse(response);

      expect(result.username).toBe('testuser');
      expect(result.displayName).toBe('Test User');
      expect(result.joined).toBe('January 2024');
      expect(result.location).toBe('Taiwan');
      expect(result.profileImage).toContain('cdninstagram.com');
    });

    it('should parse Chinese profile with 億+ format', () => {
      const response = loadFixture('profile-basic-zh.txt');
      const result = parseProfileResponse(response);

      expect(result.username).toBe('testuser');
      expect(result.displayName).toBe('Test User');
      expect(result.joined).toBe('2024年1月');
      expect(result.location).toBe('台灣');
    });

    it('should parse Japanese profile with 億人以上 format', () => {
      const response = loadFixture('profile-basic-ja.txt');
      const result = parseProfileResponse(response);

      expect(result.username).toBe('testuser');
      expect(result.displayName).toBe('Test User');
      expect(result.joined).toBe('2023年7月');
      expect(result.location).toBe('台湾');
    });
  });

  describe('verified accounts with extra fields', () => {
    it('should handle profile with Verified by Meta (4 fields)', () => {
      const response = loadFixture('profile-verified.txt');
      const result = parseProfileResponse(response);

      expect(result.username).toBe('testverified');
      expect(result.joined).toBe('July 2023');
      expect(result.location).toBe('United States');
    });
  });

  describe('edge cases', () => {
    it('should return null for invalid JSON', () => {
      const result = parseProfileResponse('not valid json');
      expect(result).toBeNull();
    });

    it('should return empty object for empty response', () => {
      const result = parseProfileResponse('{}');
      expect(result).toEqual({});
    });
  });
});
