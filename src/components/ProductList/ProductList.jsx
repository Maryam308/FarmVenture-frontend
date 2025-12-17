// src/components/ProductList/ProductList.jsx
import { useState, useEffect, useMemo } from 'react';  
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
  
  // New state variables for search, filtering, sorting, and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' or specific category
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'price-low-high', 'price-high-low'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // Number of products per page

  // Extract unique categories from products
  const categories = useMemo(() => {
    const uniqueCategories = new Set();
    products.forEach(product => {
      if (product.category) {
        uniqueCategories.add(product.category);
      }
    });
    return ['all', ...Array.from(uniqueCategories).sort()];
  }, [products]);

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


  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Apply user role based filters
    if (user?.role === 'admin') {
      // Admins can see all products, apply status filter
      if (statusFilter === 'active') filtered = filtered.filter(p => p.is_active);
      if (statusFilter === 'inactive') filtered = filtered.filter(p => !p.is_active);
    } else {
      // Regular users only see active products
      filtered = filtered.filter(p => p.is_active);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => 
        product.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'price-low-high':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high-low':
        filtered.sort((a, b) => b.price - a.price);
        break;
      default:
        // Default to newest first
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return filtered;
  }, [products, user, statusFilter, searchQuery, categoryFilter, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, sortBy, statusFilter]);

  const activeCount = products.filter(p => p.is_active).length;
  const inactiveCount = products.filter(p => !p.is_active).length;
  const totalCount = products.length;

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than or equal to maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show limited pages with ellipsis
      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // In the middle
        pageNumbers.push(1);
        pageNumbers.push('...');
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  if (loading) {
    return (
      <main className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.loadingSpinner}></div>
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
          {user?.role === 'admin' && (
            <span className={styles.statInactive}>{inactiveCount} Inactive</span>
          )}
          <span className={styles.statTotal}>{totalCount} Total</span>
          {searchQuery && (
            <span className={styles.searchResults}>
              {filteredProducts.length} results for "{searchQuery}"
            </span>
          )}
        </div>
        
        {/* Search and Filter Bar */}
        <div className={styles.searchFilterBar}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search products by name, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button 
                className={styles.clearSearch}
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className={styles.filterRow}>
            {/* Category Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="categoryFilter" className={styles.filterLabel}>
                Category:
              </label>
              <select
                id="categoryFilter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Categories</option>
                {categories.filter(cat => cat !== 'all').map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className={styles.filterGroup}>
              <label htmlFor="sortBy" className={styles.filterLabel}>
                Sort by:
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Admin Controls - Only for admins */}
        {user?.role === 'admin' && (
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
        )}
      </div>
      
      {filteredProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <p>
            {searchQuery 
              ? `No products found matching "${searchQuery}"`
              : categoryFilter !== 'all'
              ? `No products found in the "${categoryFilter}" category`
              : user?.role === 'admin' && statusFilter !== 'all'
              ? `No ${statusFilter} products found`
              : 'No products available.'}
          </p>
          <div className={styles.emptyStateButtonGroup}>
            {(searchQuery || categoryFilter !== 'all') && (
              <button 
                className={styles.clearFiltersButton}
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                }}
              >
                ✕ Clear Filters
              </button>
            )}
            {/* Only show "Add New Product" button for admins */}
            {user?.role === 'admin' && (
              <Link to="/products/new" className={styles.addButton}>
                ➕ Create Your First Product
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className={styles.resultsInfo}>
            <p>
              Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
              {searchQuery && ` for "${searchQuery}"`}
            </p>
            <div className={styles.sortIndicator}>
              {sortBy === 'price-low-high' && 'Sorted by: Price (Low to High)'}
              {sortBy === 'price-high-low' && 'Sorted by: Price (High to Low)'}
              {sortBy === 'newest' && 'Sorted by: Newest First'}
              {sortBy === 'oldest' && 'Sorted by: Oldest First'}
            </div>
          </div>
          
          <div className={styles.grid}>
            {currentProducts.map((product) => (
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={`${styles.pageButton} ${currentPage === 1 ? styles.disabled : ''}`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>
              
              <div className={styles.pageNumbers}>
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className={styles.ellipsis}>...</span>
                  ) : (
                    <button
                      key={page}
                      className={`${styles.pageButton} ${currentPage === page ? styles.active : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>
              
              <button
                className={`${styles.pageButton} ${currentPage === totalPages ? styles.disabled : ''}`}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default ProductList;