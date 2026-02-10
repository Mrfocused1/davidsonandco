const API_KEY = import.meta.env.VITE_PEXELS_API_KEY;
const CACHE_KEY = 'pexels_portfolio_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const fetchPexelsImages = async (query = 'UK luxury property', perPage = 10) => {
    // Check cache first
    const cached = localStorage.getItem(`${CACHE_KEY}_${query}_${perPage}`);
    if (cached) {
        try {
            const { data, timestamp } = JSON.parse(cached);
            const now = Date.now();
            if (now - timestamp < CACHE_DURATION) {
                console.log('Using cached Pexels images');
                return data;
            }
        } catch (e) {
            console.warn('Cache parse error:', e);
        }
    }

    try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`, {
            headers: {
                Authorization: API_KEY
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const data = await response.json();
        const photos = data.photos || [];

        // Cache the result
        try {
            localStorage.setItem(`${CACHE_KEY}_${query}_${perPage}`, JSON.stringify({
                data: photos,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('Failed to cache:', e);
        }

        return photos;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('Pexels API request timed out');
        } else {
            console.error('Error fetching Pexels images:', error);
        }
        return [];
    }
};

export const fetchPexelsVideos = async (query = 'UK luxury property', perPage = 5) => {
    try {
        const response = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}`, {
            headers: {
                Authorization: API_KEY
            }
        });
        const data = await response.json();
        return data.videos || [];
    } catch (error) {
        console.error('Error fetching Pexels videos:', error);
        return [];
    }
};
