// src/services/productService.js
const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/products`;
const ADMIN_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/admin/products`;

// Get all products (public - no auth required)
const getAllProducts = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams ? `${BASE_URL}?${queryParams}` : BASE_URL;
    
    const res = await fetch(url);
    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || `HTTP error! status: ${res.status}`;
      } catch {
        errorMessage = errorText || `HTTP error! status: ${res.status}`;
      }
      throw new Error(errorMessage);
    }
    return res.json();
  } catch (error) {
    throw error;
  }
};

// Get all products including inactive (admin only)
const getAllProductsAdmin = async (showInactive = false) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(
      `${ADMIN_BASE_URL}?show_inactive=${showInactive}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || `HTTP error! status: ${res.status}`;
      } catch {
        errorMessage = errorText || `HTTP error! status: ${res.status}`;
      }
      throw new Error(errorMessage);
    }
    
    return res.json();
  } catch (error) {
    throw error;
  }
};

// Get single product (public - only active)
const getProduct = async (productId) => {
  try {
    const res = await fetch(`${BASE_URL}/${productId}`);
    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || `HTTP error! status: ${res.status}`;
      } catch {
        errorMessage = errorText || `HTTP error! status: ${res.status}`;
      }
      throw new Error(errorMessage);
    }
    return res.json();
  } catch (error) {
    throw error;
  }
};

// Get any product (including inactive) - for authenticated users
const getAnyProduct = async (productId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      // If no token, use regular endpoint (will only get active products)
      return await getProduct(productId);
    }
    
    const res = await fetch(`${BASE_URL}/${productId}/any`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!res.ok) {
      // If unauthorized or product not found, fall back to regular endpoint
      if (res.status === 403 || res.status === 404) {
        return await getProduct(productId);
      }
      const errorText = await res.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || `HTTP error! status: ${res.status}`;
      } catch {
        errorMessage = errorText || `HTTP error! status: ${res.status}`;
      }
      throw new Error(errorMessage);
    }
    
    return res.json();
  } catch (error) {
    // Fall back to regular endpoint
    return await getProduct(productId);
  }
};

// Upload image to Cloudinary
const uploadImage = async (file) => {
  try {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/products/upload-image`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || 'Failed to upload image';
      } catch {
        errorMessage = errorText || 'Failed to upload image';
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.url;
    
  } catch (error) {
    throw error;
  }
};

// Create product
const createProduct = async (productData) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || `Failed to create product: ${res.status}`;
      } catch {
        errorMessage = errorText || `Failed to create product: ${res.status}`;
      }
      throw new Error(errorMessage);
    }
    
    return res.json();
  } catch (error) {
    throw error;
  }
};

// Update product
const updateProduct = async (productId, productData) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/${productId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || `Failed to update product: ${res.status}`;
      } catch {
        errorMessage = errorText || `Failed to update product: ${res.status}`;
      }
      throw new Error(errorMessage);
    }
    
    return res.json();
  } catch (error) {
    throw error;
  }
};

// Toggle product active status (admin only)
const toggleProductActive = async (productId, isActive) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(
      `${ADMIN_BASE_URL}/${productId}/toggle-active?is_active=${isActive}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || `Failed to toggle product status: ${res.status}`;
      } catch {
        errorMessage = errorText || `Failed to toggle product status: ${res.status}`;
      }
      throw new Error(errorMessage);
    }
    
    return res.json();
  } catch (error) {
    throw error;
  }
};

// DELETE product (HARD DELETE - permanent)
const deleteProduct = async (productId) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/${productId}`, {
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
        errorMessage = errorJson.detail || errorJson.message || `Failed to delete product: ${res.status}`;
      } catch {
        errorMessage = errorText || `Failed to delete product: ${res.status}`;
      }
      throw new Error(errorMessage);
    }
    
    return res.json();
  } catch (error) {
    throw error;
  }
};

// Get user's products (public - only active)
const getUserProducts = async (userId) => {
  // Check if userId is valid
  if (!userId || userId === 'undefined') {
    throw new Error('Invalid user ID');
  }
  
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}/products`);
    
    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || `HTTP error! status: ${res.status}`;
      } catch {
        errorMessage = errorText || `HTTP error! status: ${res.status}`;
      }
      throw new Error(errorMessage);
    }
    
    return res.json();
  } catch (error) {
    throw error;
  }
};

// Get all user's products (including inactive - for profile page)
const getAllUserProducts = async (userId) => {
  // Check if userId is valid
  if (!userId || userId === 'undefined') {
    throw new Error('Invalid user ID');
  }
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}/all-products`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || `HTTP error! status: ${res.status}`;
      } catch {
        errorMessage = errorText || `HTTP error! status: ${res.status}`;
      }
      throw new Error(errorMessage);
    }
    
    return res.json();
  } catch (error) {
    throw error;
  }
};

// Helper function to check if user can view a product
export const canViewProduct = (product, user) => {
  if (!product) return false;
  
  // Active products can be viewed by anyone
  if (product.is_active) return true;
  
  // Inactive products can only be viewed by owner or admin
  if (!user) return false;
  
  const isOwner = product.user?.id === user.id;
  const isAdmin = user.role === 'admin';
  
  return isOwner || isAdmin;
};

export { 
  getAllProducts, 
  getAllProductsAdmin,
  getProduct,
  getAnyProduct,
  uploadImage,
  createProduct, 
  updateProduct, 
  deleteProduct,
  toggleProductActive,
  getUserProducts,
  getAllUserProducts
};