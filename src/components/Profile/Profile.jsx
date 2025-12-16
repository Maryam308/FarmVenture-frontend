// src/components/Profile/Profile.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as productService from '../../services/productService';
import styles from './Profile.module.css';

const Profile = ({ user }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [userProducts, setUserProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Use dropdown filter instead of toggle
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'inactive', 'all'

  useEffect(() => {
    const fetchUserProducts = async () => {
      try {
        setLoading(true);
        if (user?.role === 'admin') {
          // Admin can see all products
          const allProducts = await productService.getAllProductsAdmin(true);
          setUserProducts(allProducts.filter(p => p.user.id === user.id));
        } else {
          // Regular users see all their products including inactive
          const allUserProducts = await productService.getAllUserProducts(user.id);
          setUserProducts(allUserProducts);
        }
      } catch (error) {
        console.error('Error fetching user products:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserProducts();
    }
  }, [user]);

  // Filter products based on selected filter
  const filteredProducts = userProducts.filter(product => {
    if (statusFilter === 'active') return product.is_active;
    if (statusFilter === 'inactive') return !product.is_active;
    return true; // 'all'
  });

  const activeCount = userProducts.filter(p => p.is_active).length;
  const inactiveCount = userProducts.filter(p => !p.is_active).length;
  const totalCount = userProducts.length;

  return (
    <main className={styles.container}>
      <section className={styles.profileHeader}>
        <h1>Your Profile</h1>
        <div className={styles.userInfo}>
          <h2>{user.username}</h2>
          <p>{user.email}</p>
          <span className={`${styles.role} ${user.role === 'admin' ? styles.admin : styles.customer}`}>
            {user.role.toUpperCase()}
          </span>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className={styles.tabsSection}>
        <div className={styles.tabNav}>
          <button
            className={`${styles.tabButton} ${activeTab === 'products' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Products
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'activities' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('activities')}
          >
            Activities
          </button>
        </div>

        {activeTab === 'products' ? (
          <div className={styles.productsSection}>
            <div className={styles.sectionHeader}>
              <h2>Your Products</h2>
              <div className={styles.productStats}>
                <span className={styles.statActive}>{activeCount} Active</span>
                <span className={styles.statInactive}>{inactiveCount} Inactive</span>
                <span className={styles.statTotal}>{totalCount} Total</span>
              </div>
            </div>
            
            {/* Dropdown Filter Controls */}
            <div className={styles.filterControls}>
              <div className={styles.filterGroup}>
                <label htmlFor="statusFilter">Filter by Status:</label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                  <option value="all">All Products</option>
                </select>
              </div>
            </div>
            
            
            
            {loading ? (
              <p>Loading your products...</p>
            ) : filteredProducts.length === 0 ? (
              <div className={styles.emptyState}>
                <p>
                  {statusFilter === 'all' 
                    ? "You haven't listed any products yet."
                    : statusFilter === 'active'
                    ? "You don't have any active products."
                    : "You don't have any inactive products."}
                </p>
                <Link to="/products/new" className={styles.addButton}>
                  Add Your First Product
                </Link>
              </div>
            ) : (
              <div className={styles.productsGrid}>
                {filteredProducts.map(product => (
                  <Link 
                    key={product.id} 
                    to={`/products/${product.id}`}
                    className={styles.productCard}
                  >
                    <div className={styles.imageContainer}>
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className={styles.productImage}
                        />
                      ) : (
                        <div className={styles.noImagePlaceholder}>
                          <span>🌱</span>
                          <p>No Image</p>
                        </div>
                      )}
                      {!product.is_active && (
                        <div className={styles.inactiveBadge}>INACTIVE</div>
                      )}
                    </div>
                    <div className={styles.productInfo}>
                      <h3>{product.name}</h3>
                      <p className={styles.price}>${product.price.toFixed(2)}</p>
                      <p className={styles.category}>{product.category}</p>
                      <span className={`${styles.status} ${product.is_active ? styles.active : styles.inactive}`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.activitiesSection}>
            <h2>Your Activities</h2>
            <div className={styles.placeholder}>
              <p>Activities feature coming soon!</p>
              <p>You'll be able to view and manage your farm activities here.</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default Profile;