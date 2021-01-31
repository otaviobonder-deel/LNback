const setCache = (req, res, next) => {
    // cache for 24h
    const period = 60 * 60 * 24;

    // cache only GET requests
    if (req.method === 'GET') {
        res.set('Cache-control', `public, max-age=${period}`);
    } else {
        // for the other requests set strict no caching parameters
        res.set('Cache-control', 'no-store');
    }

    next();
};

module.exports = setCache;
