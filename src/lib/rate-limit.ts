interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

interface RateLimitConfig {
  interval: number;
  maxRequests: number;
}

export function checkRateLimit(ip: string, config: RateLimitConfig) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (record && now > record.resetTime) {
    rateLimitMap.delete(ip);
  }

  const currentRecord = rateLimitMap.get(ip);
  if (!currentRecord) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + config.interval,
    });
    return { success: true, remaining: Math.max(config.maxRequests - 1, 0) };
  }

  if (currentRecord.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      retryAfter: Math.max(Math.ceil((currentRecord.resetTime - now) / 1000), 1),
    };
  }

  currentRecord.count += 1;
  return {
    success: true,
    remaining: Math.max(config.maxRequests - currentRecord.count, 0),
  };
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "127.0.0.1";
}
