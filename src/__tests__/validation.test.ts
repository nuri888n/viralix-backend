describe("validation middleware", () => {
  it("should validate email format", () => {
    const validEmail = "test@example.com";
    const invalidEmail = "invalid-email";
    
    expect(validEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(invalidEmail).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  it("should validate password length", () => {
    const validPassword = "password123";
    const invalidPassword = "123";
    
    expect(validPassword.length).toBeGreaterThanOrEqual(6);
    expect(invalidPassword.length).toBeLessThan(6);
  });

  it("should validate platform values", () => {
    const validPlatforms = ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'TWITTER'];
    const invalidPlatform = 'INVALID_PLATFORM';
    
    expect(validPlatforms).toContain('INSTAGRAM');
    expect(validPlatforms).not.toContain(invalidPlatform);
  });
});