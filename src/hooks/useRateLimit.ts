import { useState, useCallback } from 'react';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

interface RateLimitState {
  attempts: number[];
  isBlocked: boolean;
  resetTime: number | null;
}

export const useRateLimit = (config: RateLimitConfig) => {
  const [state, setState] = useState<RateLimitState>({
    attempts: [],
    isBlocked: false,
    resetTime: null,
  });

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Filter out old attempts
    const recentAttempts = state.attempts.filter(time => time > windowStart);
    
    if (recentAttempts.length >= config.maxAttempts) {
      const oldestAttempt = Math.min(...recentAttempts);
      const resetTime = oldestAttempt + config.windowMs;
      
      setState(prev => ({
        ...prev,
        attempts: recentAttempts,
        isBlocked: true,
        resetTime,
      }));
      
      return false;
    }
    
    setState(prev => ({
      ...prev,
      attempts: recentAttempts,
      isBlocked: false,
      resetTime: null,
    }));
    
    return true;
  }, [config, state.attempts]);

  const recordAttempt = useCallback(() => {
    const now = Date.now();
    setState(prev => ({
      ...prev,
      attempts: [...prev.attempts, now],
    }));
  }, []);

  const getRemainingTime = useCallback(() => {
    if (!state.resetTime) return 0;
    return Math.max(0, Math.ceil((state.resetTime - Date.now()) / 1000));
  }, [state.resetTime]);

  return {
    isBlocked: state.isBlocked,
    checkRateLimit,
    recordAttempt,
    getRemainingTime,
    attemptsRemaining: Math.max(0, config.maxAttempts - state.attempts.length),
  };
};