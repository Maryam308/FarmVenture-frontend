// src/components/Profile/Profile.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as productService from '../../services/productService';
import * as favoriteService from '../../services/favoriteService';
import styles from './Profile.module.css';

const Profile = ({ user }) => {
  // Main tab state
  const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 'products' : 'favorites');
  
  // Sub-filter states
  const [favoriteFilter, setFavoriteFilter] = useState('all'); // 'all', 'products', 'activities'
  const [adminFilter, setAdminFilter] = useState('products'); // 'products', 'activities'
  
  const [userProducts, setUserProducts] = useState([]);
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [favoriteActivities, setFavoriteActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for admin product status filter
  const [statusFilter, setStatusFilter] = useState('active');

  // MAIN DATA FETCH - runs once on mount and when user changes
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        console.log('Profile: No user found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Profile: User object:', user);
        
        if (user.role === 'admin') {
          // Admin: fetch products
          console.log('Profile: Fetching all products for admin');
          const allProducts = await productService.getAllProductsAdmin(true);
          console.log("Profile: Admin products fetched:", allProducts.length);
          setUserProducts(allProducts);
        } else if (user.role === 'customer') {
          // Customer: fetch favorites
          console.log('Profile: Fetching favorites for customer');
          
          const allFavorites = await favoriteService.getFavorites();
          console.log('Profile: Received favorites data:', allFavorites);
          
          const products = [];
          const activities = [];
          
          allFavorites.forEach((fav, index) => {
            console.log(`Processing favorite ${index}:`, fav);
            
            if (fav.item_type === 'product' && fav.item) {
              console.log('Found product favorite with item data:', fav.item);
              products.push({
                ...fav.item,
                favorite_id: fav.id,
                favorited_at: fav.created_at
              });
            } else if (fav.item_type === 'activity' && fav.item) {
              console.log('Found activity favorite with item data:', fav.item);
              activities.push({
                ...fav.item,
                favorite_id: fav.id,
                favorited_at: fav.created_at
              });
            }
          });
          
          console.log('Profile: Products found:', products.length);
          console.log('Profile: Activities found:', activities.length);
          setFavoriteProducts(products);
          setFavoriteActivities(activities);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError(error.message || 'Failed to load profile data');
      } finally {
        console.log("Profile: Setting loading to false");
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.sub, user?.role]);

  // Listen for favorite updates - only for customers
  useEffect(() => {
    if (!user || user.role !== 'customer') return;

    const handleFavoriteUpdate = async () => {
      console.log('Profile: Favorite update event received, refreshing favorites');
      
      try {
        const allFavorites = await favoriteService.getFavorites();
        console.log('Profile: Refreshed favorites:', allFavorites);
        
        const products = [];
        const activities = [];
        
        allFavorites.forEach((fav) => {
          if (fav.item_type === 'product' && fav.item) {
            products.push({
              ...fav.item,
              favorite_id: fav.id,
              favorited_at: fav.created_at
            });
          } else if (fav.item_type === 'activity' && fav.item) {
            activities.push({
              ...fav.item,
              favorite_id: fav.id,
              favorited_at: fav.created_at
            });
          }
        });
        
        setFavoriteProducts(products);
        setFavoriteActivities(activities);
      } catch (error) {
        console.error('Error refreshing favorites:', error);
      }
    };

    window.addEventListener("favoriteUpdated", handleFavoriteUpdate);
    window.addEventListener("storage", handleFavoriteUpdate);

    return () => {
      window.removeEventListener("favoriteUpdated", handleFavoriteUpdate);
      window.removeEventListener("storage", handleFavoriteUpdate);
    };
  }, [user?.sub, user?.role]);

  // Filter bookings based on status
  const filteredBookings = bookings.filter((booking) => {
    if (bookingStatusFilter === "all") return true;
    return booking.status === bookingStatusFilter;
  });

  // Filter products based on selected filter (admin only)
  const filteredProducts = userProducts.filter(product => {
    if (statusFilter === 'active') return product.is_active;
    if (statusFilter === 'inactive') return !product.is_active;
    return true;
  });

  const activeCount = userProducts.filter(p => p.is_active).length;
  const inactiveCount = userProducts.filter(p => !p.is_active).length;
  const totalCount = userProducts.length;

  // Get favorites based on filter
  const getFilteredFavorites = () => {
    if (favoriteFilter === 'products') return favoriteProducts;
    if (favoriteFilter === 'activities') return favoriteActivities;
    // 'all' - combine both
    return [...favoriteProducts, ...favoriteActivities];
  };

  // Handle favorite toggle for Profile
  const handleFavoriteToggle = async (itemId, itemType, isFavorited) => {
    if (!user || user.role !== 'customer') return;
    
    try {
      if (isFavorited) {
        await favoriteService.removeFavorite(itemId, itemType);
      } else {
        await favoriteService.addFavorite(itemId, itemType);
      }
      
      localStorage.setItem('favorites_updated', Date.now().toString());
      window.dispatchEvent(new Event('favoriteUpdated'));
    } catch (error) {
      console.error("Error toggling favorite from profile:", error);
    }
  };

  // Format booking status for display
  const formatBookingStatus = (status) => {
    const statusMap = {
      upcoming: { text: "Upcoming", className: styles.upcoming },
      today: { text: "Today", className: styles.today },
      past: { text: "Past", className: styles.past },
    };

    const statusInfo = statusMap[status] || {
      text: status,
      className: styles.default,
    };
    return (
      <span className={`${styles.statusBadge} ${statusInfo.className}`}>
        {statusInfo.text}
      </span>
    );
  };

  if (!user) {
    return (
      <main className={styles.container}>
        <div className={styles.errorState}>
          <h2>Please Sign In</h2>
          <p>You need to be signed in to view your profile.</p>
          <Link to="/signin" className={styles.browseButton}>
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  const filteredFavorites = getFilteredFavorites();

  return (
    <main className={styles.container}>
      <section className={styles.profileHeader}>
        <h1>My Profile</h1>
        <div className={styles.userInfo}>
          <h2>{user.username || user.email || "User"}</h2>
          <p>{user.email}</p>
          <span
            className={`${styles.role} ${
              user.role === "admin" ? styles.admin : styles.customer
            }`}
          >
            {user.role?.toUpperCase() || "USER"}
          </span>
        </div>
      </section>

      {error && (
        <div className={styles.errorMessage}>
          <p>⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      )}

      <section className={styles.tabsSection}>
        {/* Main Tabs */}
        <div className={styles.tabNav}>
          {user?.role === 'admin' ? (
            <>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "products" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("products")}
              >
                Product Management
              </button>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "bookings" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("bookings")}
              >
                Bookings Management
              </button>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "activities" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("activities")}
              >
                Activity Management
              </button>
            </>
          ) : (
            <>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "favorites" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("favorites")}
              >
                Favorites
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'bookings' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('bookings')}
              >
                Booked Activities
              </button>
            </>
          )}
        </div>

        {/* ADMIN VIEW */}
        {user?.role === 'admin' && (
          <>
            {/* Product Management Tab */}
            {activeTab === 'products' && (
              <div className={styles.productsSection}>
                <div className={styles.sectionHeader}>
                  <h2>All Products Management</h2>
                  <div className={styles.productStats}>
                    <span className={styles.statActive}>
                      {activeCount} Active
                    </span>
                    <span className={styles.statInactive}>
                      {inactiveCount} Inactive
                    </span>
                    <span className={styles.statTotal}>{totalCount} Total</span>
                  </div>
                </div>
                
                <div className={styles.filterControls}>
                  <div className={styles.filterGroup}>
                    <label
                      htmlFor="statusFilter"
                      className={styles.filterLabel}
                    >
                      Filter by Status:
                    </label>
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
                  <div className={styles.adminNote}>
                    <p>
                      💼 As an admin, you can manage all products on the
                      platform.
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading products...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📦</div>
                    <p>
                      {statusFilter === "all"
                        ? "No products found in the platform."
                        : statusFilter === "active"
                        ? "No active products found."
                        : "No inactive products found."}
                    </p>
                    <Link to="/products/new" className={styles.addButton}>
                      Create First Product
                    </Link>
                  </div>
                ) : (
                  <div className={styles.productsGrid}>
                    {filteredProducts.map((product) => (
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
                          <p className={styles.price}>
                            ${product.price.toFixed(2)}
                          </p>
                          <p className={styles.category}>{product.category}</p>
                          <div className={styles.ownerInfo}>
                            <p className={styles.owner}>
                              Owner: {product.user?.username || "Unknown"}
                            </p>
                          </div>
                          <span
                            className={`${styles.status} ${
                              product.is_active
                                ? styles.active
                                : styles.inactive
                            }`}
                          >
                            {product.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Activity Management Tab */}
            {activeTab === 'activities' && (
              <div className={styles.productsSection}>
                <div className={styles.sectionHeader}>
                  <h2>All Activities Management</h2>
                </div>
                
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🎯</div>
                  <p>Activity management is coming soon!</p>
                  <p className={styles.helperText}>
                    You'll be able to manage all activities on the platform here.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* CUSTOMER VIEW */}
        {user?.role === 'customer' && (
          <>
            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div className={styles.favoritesSection}>
                <div className={styles.sectionHeader}>
                  <h2>My Favorites</h2>
                  <div className={styles.favoritesStats}>
                    <span className={styles.statCount}>
                      {favoriteProducts.length + favoriteActivities.length} Total
                    </span>
                    <span className={styles.statProducts}>
                      {favoriteProducts.length} Products
                    </span>
                    <span className={styles.statActivities}>
                      {favoriteActivities.length} Activities
                    </span>
                  </div>
                </div>

                {/* Sub-filter for favorites */}
                <div className={styles.subFilterControls}>
                  <div className={styles.filterGroup}>
                    <label htmlFor="favoriteFilter" className={styles.filterLabel}>
                      Show:
                    </label>
                    <select
                      id="favoriteFilter"
                      value={favoriteFilter}
                      onChange={(e) => setFavoriteFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="all">All Favorites</option>
                      <option value="products">Products Only</option>
                      <option value="activities">Activities Only</option>
                    </select>
                  </div>
                </div>
                
                {loading ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading favorites...</p>
                  </div>
                ) : filteredFavorites.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>❤️</div>
                    <p>
                      {favoriteFilter === 'all' 
                        ? "You haven't favorited anything yet."
                        : favoriteFilter === 'products'
                        ? "You haven't favorited any products yet."
                        : "You haven't favorited any activities yet."}
                    </p>
                    <p className={styles.helperText}>
                      Browse {favoriteFilter === 'activities' ? 'activities' : 'products'} and click the heart icon to add them to favorites.
                    </p>
                    <div className={styles.buttonGroup}>
                      <Link to="/products" className={styles.browseButton}>
                        Browse Products
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className={styles.favoritesGrid}>
                    {filteredFavorites.map((item) => {
                      const isProduct = item.name !== undefined; // Products have 'name', activities have 'title'
                      const itemType = isProduct ? 'product' : 'activity';
                      
                      return (
                        <div key={`${itemType}-${item.id}`} className={styles.favoriteCard}>
                          <div className={styles.cardHeader}>
                            <span className={styles.typeBadge}>
                              {isProduct ? 'Product' : 'Activity'}
                            </span>
                            <button
                              className={styles.favoriteButton}
                              onClick={() => handleFavoriteToggle(item.id, itemType, true)}
                              aria-label="Remove from favorites"
                            >
                            </button>
                          </div>
                          <div className={styles.cardContent}>
                            <h3>{isProduct ? (item.name || 'Untitled Product') : (item.title || 'Untitled Activity')}</h3>
                            <p className={styles.price}>
                              ${item.price?.toFixed(2) || '0.00'}
                              {!isProduct && ' per person'}
                            </p>
                            {isProduct ? (
                              <p className={styles.category}>{item.category || 'Uncategorized'}</p>
                            ) : (
                              <>
                                <p className={styles.activityDate}>
                                  📅 {new Date(item.date_time).toLocaleDateString()}
                                </p>
                                <p className={styles.activityDuration}>
                                  ⏱️ {item.duration_minutes} minutes
                                </p>
                              </>
                            )}
                            <p className={styles.description}>{item.description || 'No description available.'}</p>
                          </div>
                          <div className={styles.cardFooter}>
                            <span className={styles.owner}>By: {item.user?.username || 'Unknown'}</span>
                            <span className={`${styles.status} ${item.is_active ? styles.active : styles.inactive}`}>
                              {item.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <Link 
                            to={isProduct ? `/products/${item.id}` : `/activities/${item.id}`}
                            className={styles.viewButton}
                          >
                            View {isProduct ? 'Product' : 'Activity'}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Booked Activities Tab */}
            {activeTab === 'bookings' && (
              <div className={styles.favoritesSection}>
                <div className={styles.sectionHeader}>
                  <h2>My Booked Activities</h2>
                  <div className={styles.favoritesStats}>
                    <span className={styles.statCount}>0 Bookings</span>
                  </div>
                </div>
                
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📅</div>
                  <p>You haven't booked any activities yet.</p>
                  <p className={styles.helperText}>
                    This feature is coming soon! You'll be able to book and manage your activity reservations here.
                  </p>
                  <div className={styles.buttonGroup}>
                    <Link to="/activities" className={styles.browseButton}>
                      Browse Activities
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
};

export default Profile;