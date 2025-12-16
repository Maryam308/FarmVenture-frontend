const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/products`;

// Get all products (public - no auth required)
const getAllProducts = async (params = {}) => {
  try {
    // Build query string from params
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams ? `${BASE_URL}?${queryParams}` : BASE_URL;
    
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    console.log('Error fetching products:', error);
    throw error;
  }
};

// Get single product
const getProduct = async (productId) => {
  try {
    const res = await fetch(`${BASE_URL}/${productId}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    console.log('Error fetching product:', error);
    throw error;
  }
};

// Create product (requires auth)
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
      const error = await res.json();
      throw new Error(error.detail || `HTTP error! status: ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    console.log('Error creating product:', error);
    throw error;
  }
};

// Update product (requires auth - owner or admin)
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
      const error = await res.json();
      throw new Error(error.detail || `HTTP error! status: ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    console.log('Error updating product:', error);
    throw error;
  }
};

// Delete product (soft delete - requires auth)
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
      const error = await res.json();
      throw new Error(error.detail || `HTTP error! status: ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    console.log('Error deleting product:', error);
    throw error;
  }
};

// Get user's products
const getUserProducts = async (userId) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}/products`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    console.log('Error fetching user products:', error);
    throw error;
  }
};

export { 
  getAllProducts, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getUserProducts 
};