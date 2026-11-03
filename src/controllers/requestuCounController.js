const axios = require("axios");

exports.checkRateLimit = async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${process.env.OWNER}/${process.env.REPO}`,
      {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'User-Agent': 'NodeApp'
        }
      }
    );

    const limit = response.headers['x-ratelimit-limit'];
    const remaining = response.headers['x-ratelimit-remaining'];
    const used = limit - remaining;
    const resetTime = new Date(response.headers['x-ratelimit-reset'] * 1000).toLocaleString('km-KH');

    return res.json({
      repoData: response.data.name,
      rateLimit: {
        limit,
        used,
        remaining,
        resetTime
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};