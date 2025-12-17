// src/components/ProductList/ProductList.jsx
import { useState, useEffect } from 'react';  
import { Link } from 'react-router-dom';
import styles from './ProductList.module.css';
import AuthorInfo from '../AuthorInfo/AuthorInfo';
import * as productService from '../../services/productService';
import { canViewProduct } from '../../services/productService';

const ProductList = ({ user, products: initialProducts = [], setProducts }) => {
  const [showInactive, setShowInactive] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [loading, setLoading] = useState(!initialProducts.length);
  const [products, setLocalProducts] = useState(initialProducts);
  
  // For admins, fetch all products including inactive
  useEffect(() => {
    const fetchProducts = async () => {
      if (user?.role === 'admin') {
        try {
          setLoading(true);
          const allProducts = await productService.getAllProductsAdmin(true); // Get all including inactive
          setLocalProducts(allProducts);
          if (setProducts) setProducts(allProducts);
        } catch (error) {
          console.error('Error fetching admin products:', error);
        } finally {
          setLoading(false);
        }
      } else if (!initialProducts.length) {
        try {
          setLoading(true);
          const publicProducts = await productService.getAllProducts();
          setLocalProducts(publicProducts);
          if (setProducts) setProducts(publicProducts);
        } catch (error) {
          console.error('Error fetching public products:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProducts();
  }, [user, initialProducts.length, setProducts]);

  // Handle status toggle for admin
  const handleToggleStatus = async (productId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const updatedProduct = await productService.toggleProductActive(productId, newStatus);
      
      // Update local state
      setLocalProducts(prev => prev.map(p => 
        p.id === productId ? updatedProduct : p
      ));
      
      if (setProducts) {
        setProducts(prev => prev.map(p => 
          p.id === productId ? updatedProduct : p
        ));
      }
    } catch (error) {
      console.error('Error toggling product status:', error);
      alert('Failed to update product status: ' + error.message);
    }
  };

  // Handle delete for admin
  const handleDelete = async (productId) => {
    if (!window.confirm('⚠️ Are you sure you want to PERMANENTLY delete this product?\n\nThis action cannot be undone!')) {
      return;
    }
    
    try {
      await productService.deleteProduct(productId);
      
      // Update local state
      setLocalProducts(prev => prev.filter(p => p.id !== productId));
      
      if (setProducts) {
        setProducts(prev => prev.filter(p => p.id !== productId));
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product: ' + error.message);
    }
  };

  // Filter products based on user role and filters
  const filteredProducts = products.filter(product => {
    if (user?.role === 'admin') {
      // Admins can see all products, apply status filter
      if (statusFilter === 'active') return product.is_active;
      if (statusFilter === 'inactive') return !product.is_active;
      return true; // 'all'
    } else {
      // Regular users only see active products, unless they toggle showInactive
      return showInactive ? true : product.is_active;
    }
  });

  const activeCount = products.filter(p => p.is_active).length;
  const inactiveCount = products.filter(p => !p.is_active).length;
  const totalCount = products.length;

  if (loading) {
    return (
      <main className={styles.container}>
        <div className={styles.emptyState}>
          <p>Loading products...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.headerSection}>
        <div className={styles.titleRow}>
          <h1>Farm Products</h1>
          {/* Create Product Button - Only for admins */}
          {user?.role === 'admin' && (
            <Link to="/products/new" className={styles.createButton}>
              + Create Product
            </Link>
          )}
        </div>
        
        {/* Product Stats */}
        <div className={styles.stats}>
          <span className={styles.statActive}>{activeCount} Active</span>
          <span className={styles.statInactive}>{inactiveCount} Inactive</span>
          <span className={styles.statTotal}>{totalCount} Total</span>
        </div>
        
        {/* Admin Controls */}
        {user?.role === 'admin' ? (
          <div className={styles.adminControls}>
            <h3>Admin Controls</h3>
            <div className={styles.filterControls}>
              <div className={styles.filterGroup}>
                <label htmlFor="statusFilter">Filter by Status:</label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Products</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          /* Regular user toggle */
          <div className={styles.filterToggle}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className={styles.toggleInput}
              />
              <span className={styles.toggleSlider}></span>
              <span className={styles.toggleText}>
                Show Inactive Products
              </span>
            </label>
            <p className={styles.filterHint}>
              {showInactive 
                ? `Showing all products including ${inactiveCount} inactive` 
                : 'Inactive products are hidden'}
            </p>
          </div>
        )}
      </div>
      
      {filteredProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <p>
            {user?.role === 'admin' 
              ? 'No products found with the current filter.'
              : showInactive 
                ? 'No products available.' 
                : 'No active products available. Try showing inactive products.'}
          </p>
          {/* Only show "Add New Product" button for admins */}
          {user?.role === 'admin' && (
            <Link to="/products/new" className={styles.addButton}>
              Create Your First Product
            </Link>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredProducts.map((product) => (
            <div key={product.id} className={styles.productCardWrapper}>
              <Link 
                to={`/products/${product.id}`} 
                className={styles.productCard}
                onClick={(e) => {
                  // Check if user can view this product
                  if (!canViewProduct(product, user)) {
                    e.preventDefault();
                    alert('This product is currently inactive and cannot be viewed.');
                  }
                }}
              >
                <article>
                  {/* Product Image */}
                  <div className={styles.imageContainer}>
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className={styles.productImage}
                      />
                    ) : (
                      <div className={styles.noImage}>
                        <span>🌱</span>
                        <p>No Image</p>
                      </div>
                    )}
                    {!product.is_active && (
                      <div className={styles.inactiveBadge}>INACTIVE</div>
                    )}
                  </div>

                  <div className={styles.productContent}>
                    <header>
                      <div className={styles.productHeader}>
                        <h2>{product.name}</h2>
                        <span className={styles.category}>{product.category}</span>
                      </div>
                      <AuthorInfo content={product} />
                    </header>
                    <p className={styles.description}>{product.description}</p>
                    <div className={styles.productFooter}>
                      <span className={styles.price}>${product.price.toFixed(2)}</span>
                      <span className={`${styles.status} ${product.is_active ? styles.active : styles.inactive}`}>
                        {product.is_active ? ' Active' : ' Inactive'}
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
              
              {/* Admin Action Buttons - Only show for admins */}
              {user?.role === 'admin' && (
                <div className={styles.adminActions}>
                  <button
                    onClick={() => handleToggleStatus(product.id, product.is_active)}
                    className={styles.toggleActiveBtn}
                  >
                    {product.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className={styles.deleteBtn}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default ProductList;