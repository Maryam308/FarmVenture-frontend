// src/services/favoriteService.js
const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/favorites`;

// Get all user's favorites (optionally filtered by type)
const getFavorites = async (itemType = null) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found for getFavorites');
      return [];
    }
    
    const url = itemType ? `${BASE_URL}?item_type=${itemType}` : BASE_URL;
    
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!res.ok) {
      console.log('Error response from getFavorites:', res.status, res.statusText);
      return [];
    }
    
    const data = await res.json();
    console.log('Favorites fetched from API:', data);
    
    // Transform the data to match expected format
    const transformedData = data.map(fav => ({
      id: fav.id,
      user_id: fav.user_id,
      item_id: fav.item_id,
      item_type: fav.item_type,
      created_at: fav.created_at,
      // Extract item details from nested object
      item: fav.item || null
    }));
    
    console.log('Transformed favorites:', transformedData);
    return transformedData;
  } catch (error) {
    console.log('Error fetching favorites:', error);
    return [];
  }
};

// Get just the IDs of favorited items (lightweight)
const getFavoriteIds = async (itemType = null) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token for getFavoriteIds');
      return { products: [], activities: [] };
    }
    
    const url = itemType ? `${BASE_URL}/ids?item_type=${itemType}` : `${BASE_URL}/ids`;
    
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!res.ok) {
      console.log('Error response from getFavoriteIds:', res.status, res.statusText);
      return { products: [], activities: [] };
    }
    
    const data = await res.json();
    console.log('Favorite IDs fetched:', data);
    return data;
  } catch (error) {
    console.log('Error fetching favorite IDs:', error);
    return { products: [], activities: [] };
  }
};

// Add an item (product or activity) to favorites
const addFavorite = async (itemId, itemType) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        item_id: itemId,
        item_type: itemType 
      })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || `Failed to add favorite: ${res.status}`;
      } catch {
        errorMessage = errorText || `Failed to add favorite: ${res.status}`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await res.json();
    console.log('Added favorite:', data);
    return data;
  } catch (error) {
    console.log('Error adding favorite:', error);
    throw error;
  }
};

// Remove an item from favorites
const removeFavorite = async (itemId, itemType) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const res = await fetch(`${BASE_URL}/${itemType}/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || `Failed to remove favorite: ${res.status}`;
      } catch {
        errorMessage = errorText || `Failed to remove favorite: ${res.status}`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await res.json();
    console.log('Removed favorite:', data);
    return data;
  } catch (error) {
    console.log('Error removing favorite:', error);
    throw error;
  }
};

// Check if an item is favorited
const checkFavorite = async (itemId, itemType) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token for checkFavorite');
      return { is_favorited: false };
    }
    
    const res = await fetch(`${BASE_URL}/check/${itemType}/${itemId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!res.ok) {
      console.log('Error response from checkFavorite:', res.status, res.statusText);
      return { is_favorited: false };
    }
    
    const data = await res.json();
    console.log('Checked favorite:', data);
    return data;
  } catch (error) {
    console.log('Error checking favorite:', error);
    return { is_favorited: false };
  }
};

// Toggle favorite status
const toggleFavorite = async (itemId, itemType, isFavorited) => {
  if (isFavorited) {
    return await removeFavorite(itemId, itemType);
  } else {
    return await addFavorite(itemId, itemType);
  }
};

export { 
  getFavorites, 
  getFavoriteIds,
  addFavorite, 
  removeFavorite, 
  checkFavorite,
  toggleFavorite
};