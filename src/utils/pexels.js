const API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

export const fetchPexelsImages = async (query = 'UK luxury property', perPage = 10) => {
    try {
        const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`, {
            headers: {
                Authorization: API_KEY
            }
        });
        const data = await response.json();
        return data.photos || [];
    } catch (error) {
        console.error('Error fetching Pexels images:', error);
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
