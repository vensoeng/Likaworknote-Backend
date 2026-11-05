
const { Redis } = require("@upstash/redis");

const redis = Redis.fromEnv();

const DEFAULT_TTL = 900;

// GET OR SET CACHE
exports.getOrSetCache = async (
  key,
  fetchFunction,
  ttl = DEFAULT_TTL
) => {
  try {
    // Read shared cache
    const cachedData = await redis.get(key);

    // Redis returns null when key does not exist.
    if (cachedData !== null) {
      return cachedData;
    }

    // Cache miss: fetch from GitHub JSON
    const freshData = await fetchFunction();

    // Save to shared Redis cache
    await redis.set(key, freshData, {
      ex: ttl,
    });

    return freshData;

  } catch (error) {
    console.error("REDIS_GET_CACHE_ERROR:", error);

    // Fallback: fetch directly if Redis is unavailable
    return await fetchFunction();
  }
};

// CLEAR CACHE
exports.clearCache = async (key) => {
  try {
    await redis.del(key);
  } catch (error) {
    console.error("REDIS_CLEAR_CACHE_ERROR:", error);

    throw error;
  }
};
