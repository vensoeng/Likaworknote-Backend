const NodeCache = require("node-cache");

const myCache = new NodeCache({
  stdTTL: 900, // default = 15 minutes
});

exports.getOrSetCache = async (
  key,
  fetchFunction,
  ttl = 900
) => {
  const cachedData = myCache.get(key);

  if (cachedData !== undefined) {
    return cachedData;
  }

  const freshData = await fetchFunction();

  myCache.set(key, freshData, ttl);

  return freshData;
};

exports.clearCache = (key) => {
  myCache.del(key);
};