// src/components/Profile/Profile.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as productService from '../../services/productService';
import * as favoriteService from '../../services/favoriteService';
import styles from './Profile.module.css';

const Profile = ({ user }) => {
  const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 'products' : 'favorites');
  const [userProducts, setUserProducts] = useState([]);
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [favoriteActivities, setFavoriteActivities] = useState([]);
  const [bookedActivities, setBookedActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [error, setError] = useState(null);
  
  // State for admin filter
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'inactive', 'all'
  
  // State for favorites filter (for customers)
  const [favoritesFilter, setFavoritesFilter] = useState('all'); // 'all', 'products', 'activities'

  // Fetch real favorites from API
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      console.log('No user for fetchFavorites');
      return;
    }
    
    try {
      setLoadingFavorites(true);
      console.log('Profile: Fetching favorites for user:', user);
      
      // Debug the API response first
      console.log('Debugging favorites API...');
      const debugResponse = await favoriteService.debugApiResponse(
        `${import.meta.env.VITE_BACKEND_URL}/api/favorites`
      );
      console.log('Debug response:', debugResponse);
      
      // Use getFavorites to get full details
      const allFavorites = await favoriteService.getFavorites();
      console.log('Profile: Received favorites data:', allFavorites);
      console.log('Profile: Number of favorites:', allFavorites.length);
      
      // Separate products and activities
      const products = [];
      const activities = [];
      
      allFavorites.forEach((fav, index) => {
        console.log(`Processing favorite ${index}:`, fav);
        
        if (fav.item_type === 'product') {
          if (fav.item) {
            console.log('Found product favorite with item data:', fav.item);
            products.push({
              ...fav.item,
              favorite_id: fav.id,
              favorited_at: fav.created_at
            });
          } else {
            console.log('Found product favorite but no item data, fav.item_id:', fav.item_id);
            // Try to fetch the product details separately if needed
          }
        } else if (fav.item_type === 'activity') {
          if (fav.item) {
            console.log('Found activity favorite with item data:', fav.item);
            activities.push({
              ...fav.item,
              favorite_id: fav.id,
              favorited_at: fav.created_at
            });
          } else {
            console.log('Found activity favorite but no item data');
          }
        }
      });
      
      console.log('Profile: Products found after processing:', products);
      console.log('Profile: Activities found after processing:', activities);
      
      setFavoriteProducts(products);
      setFavoriteActivities(activities);
    } catch (error) {
      console.error('Profile: Error fetching favorites:', error);
      setFavoriteProducts([]);
      setFavoriteActivities([]);
    } finally {
      setLoadingFavorites(false);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Profile: User object:', user);
        
        if (!user) {
          console.log('Profile: No user found');
          setUserProducts([]);
          return;
        }
        
        if (user?.role === 'admin') {
          // Admin can see all products (including inactive)
          console.log('Profile: Fetching all products for admin');
          const allProducts = await productService.getAllProductsAdmin(true);
          console.log('Profile: Admin products fetched:', allProducts.length);
          setUserProducts(allProducts);
        } else {
          // Regular users see only their own products including inactive
          console.log('Profile: Fetching user products for user:', user);
          
          // Get user ID - check different possible locations
          const userId = user.id || user._id || user.userId;
          console.log('Profile: Extracted userId:', userId);
          
          if (!userId) {
            console.error('Profile: User ID not found in user object:', user);
            throw new Error('User ID not found in user object');
          }
          
          const allUserProducts = await productService.getAllUserProducts(userId);
          console.log('Profile: User products fetched:', allUserProducts.length);
          setUserProducts(allUserProducts);
          
          // Fetch real favorites
          console.log('Profile: Starting to fetch favorites...');
          await fetchFavorites();
          
          // TODO: Replace with actual API calls when available
          // Mock data for demonstration (activities)
          console.log('Profile: Setting mock booked activities');
          setBookedActivities([
            {
              id: 1,
              title: 'Farm Tour & Tasting',
              date_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              price: 25.00,
              status: 'Confirmed',
              ticket_code: 'FARM-2024-001'
            },
            {
              id: 2,
              title: 'Cheese Making Workshop',
              date_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
              price: 45.00,
              status: 'Confirmed',
              ticket_code: 'CHEESE-2024-002'
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError(error.message || 'Failed to load profile data');
        setUserProducts([]);
        setFavoriteProducts([]);
        setFavoriteActivities([]);
      } finally {
        console.log('Profile: Setting loading to false');
        setLoading(false);
      }
    };

    console.log('Profile: Component mounted, user:', user);
    if (user) {
      console.log('Profile: User detected, fetching data');
      fetchData();
    } else {
      console.log('Profile: No user, setting loading to false');
      setLoading(false);
    }
  }, [user, fetchFavorites]);

  // Listen for favorite updates
  useEffect(() => {
    const handleFavoriteUpdate = () => {
      console.log('Profile: Favorite update event received');
      fetchFavorites();
    };

    window.addEventListener('favoriteUpdated', handleFavoriteUpdate);
    window.addEventListener('storage', handleFavoriteUpdate);

    return () => {
      window.removeEventListener('favoriteUpdated', handleFavoriteUpdate);
      window.removeEventListener('storage', handleFavoriteUpdate);
    };
  }, [fetchFavorites]);

  // Filter products based on selected filter (admin only)
  const filteredProducts = userProducts.filter(product => {
    if (statusFilter === 'active') return product.is_active;
    if (statusFilter === 'inactive') return !product.is_active;
    return true; // 'all'
  });

  // Filter favorites based on selected filter (customer only)
  const getFilteredFavorites = () => {
    if (favoritesFilter === 'products') {
      return favoriteProducts;
    } else if (favoritesFilter === 'activities') {
      return favoriteActivities;
    } else {
      return [...favoriteProducts, ...favoriteActivities];
    }
  };

  const filteredFavorites = getFilteredFavorites();
  const activeCount = userProducts.filter(p => p.is_active).length;
  const inactiveCount = userProducts.filter(p => !p.is_active).length;
  const totalCount = userProducts.length;

  // Add favorite toggle handler for Profile
  const handleFavoriteToggle = async (itemId, itemType, isFavorited) => {
    if (!user) return;
    
    try {
      if (isFavorited) {
        await favoriteService.removeFavorite(itemId, itemType);
      } else {
        await favoriteService.addFavorite(itemId, itemType);
      }
      
      // Trigger update
      localStorage.setItem('favorites_updated', Date.now().toString());
      window.dispatchEvent(new Event('favoriteUpdated'));
      
      // Refresh favorites
      await fetchFavorites();
    } catch (error) {
      console.error('Error toggling favorite from profile:', error);
    }
  };

  if (!user) {
    return (
      <main className={styles.container}>
        <div className={styles.errorState}>
          <h2>Please Sign In</h2>
          <p>You need to be signed in to view your profile.</p>
          <Link to="/login" className={styles.browseButton}>
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  console.log('Profile: Rendering, loading:', loading, 'loadingFavorites:', loadingFavorites);
  console.log('Profile: favoriteProducts count:', favoriteProducts.length);
  console.log('Profile: favoriteActivities count:', favoriteActivities.length);

  return (
    <main className={styles.container}>
      <section className={styles.profileHeader}>
        <h1>Your Profile</h1>
        <div className={styles.userInfo}>
          <h2>{user.username || user.email || 'User'}</h2>
          <p>{user.email}</p>
          <span className={`${styles.role} ${user.role === 'admin' ? styles.admin : styles.customer}`}>
            {user.role?.toUpperCase() || 'USER'}
          </span>
        </div>
      </section>

      {/* Debug Info - Remove in production */}
      <div style={{ background: '#f5f5f5', padding: '10px', margin: '10px 0', borderRadius: '5px' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
          Debug: Loading={loading ? 'true' : 'false'}, 
          Favorites Loading={loadingFavorites ? 'true' : 'false'}, 
          Products={favoriteProducts.length}, 
          Activities={favoriteActivities.length}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage}>
          <p>⚠️ {error}</p>
          <button onClick={() => window.location.reload()} className={styles.retryButton}>
            Retry
          </button>
        </div>
      )}

      {/* Tab Navigation - Different tabs for admin vs customer */}
      <section className={styles.tabsSection}>
        <div className={styles.tabNav}>
          {user?.role === 'admin' ? (
            // Admin tabs
            <>
              <button
                className={`${styles.tabButton} ${activeTab === 'products' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('products')}
              >
                Products Management
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'activities' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('activities')}
              >
                Activities Management
              </button>
            </>
          ) : (
            // Customer tabs - Only Favorites and Booked Activities
            <>
              <button
                className={`${styles.tabButton} ${activeTab === 'favorites' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('favorites')}
              >
                <span className={styles.tabIcon}>❤️</span>
                My Favorites
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'booked' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('booked')}
              >
                <span className={styles.tabIcon}>🎫</span>
                Booked Activities
              </button>
            </>
          )}
        </div>

        {user?.role === 'admin' ? (
          // Admin content
          <>
            {activeTab === 'products' ? (
              <div className={styles.productsSection}>
                <div className={styles.sectionHeader}>
                  <h2>All Products Management</h2>
                  <div className={styles.productStats}>
                    <span className={styles.statActive}>{activeCount} Active</span>
                    <span className={styles.statInactive}>{inactiveCount} Inactive</span>
                    <span className={styles.statTotal}>{totalCount} Total</span>
                  </div>
                </div>
                
                {/* Dropdown Filter Controls */}
                <div className={styles.filterControls}>
                  <div className={styles.filterGroup}>
                    <label htmlFor="statusFilter" className={styles.filterLabel}>
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
                    <p>💼 As an admin, you can manage all products on the platform.</p>
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
                      {statusFilter === 'all' 
                        ? "No products found in the platform."
                        : statusFilter === 'active'
                        ? "No active products found."
                        : "No inactive products found."}
                    </p>
                    <Link to="/products/new" className={styles.addButton}>
                      Create First Product
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
                          <div className={styles.ownerInfo}>
                            <p className={styles.owner}>Owner: {product.user?.username || 'Unknown'}</p>
                          </div>
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
              // Admin Activities Management Tab
              <div className={styles.activitiesSection}>
                <div className={styles.sectionHeader}>
                  <h2>Activities Management</h2>
                  <div className={styles.placeholderStats}>
                    <span className={styles.statCount}>0 Activities</span>
                  </div>
                </div>
                <div className={styles.placeholder}>
                  <div className={styles.placeholderIcon}>📅</div>
                  <p>Activities management feature coming soon!</p>
                  <p className={styles.helperText}>You'll be able to create and manage farm activities here.</p>
                </div>
              </div>
            )}
          </>
        ) : (
          // Customer content - Only Favorites and Booked Activities
          <>
            {activeTab === 'favorites' ? (
              <div className={styles.favoritesSection}>
                <div className={styles.sectionHeader}>
                  <h2>My Favorites ❤️</h2>
                  <div className={styles.favoritesStats}>
                    <span className={styles.statCount}>
                      {filteredFavorites.length} {filteredFavorites.length === 1 ? 'Item' : 'Items'}
                    </span>
                  </div>
                </div>
                
                {/* Favorites Filter Dropdown */}
                <div className={styles.filterControls}>
                  <div className={styles.filterGroup}>
                    <label htmlFor="favoritesFilter" className={styles.filterLabel}>
                      Filter Favorites:
                    </label>
                    <select
                      id="favoritesFilter"
                      value={favoritesFilter}
                      onChange={(e) => setFavoritesFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="all">All Favorites</option>
                      <option value="products">Favorite Products</option>
                      <option value="activities">Favorite Activities</option>
                    </select>
                  </div>
                </div>
                
                {loading || loadingFavorites ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading favorites...</p>
                  </div>
                ) : filteredFavorites.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>❤️</div>
                    <p>
                      {favoritesFilter === 'all' 
                        ? "You haven't favorited any items yet."
                        : favoritesFilter === 'products'
                        ? "You haven't favorited any products yet."
                        : "You haven't favorited any activities yet."}
                    </p>
                    <p className={styles.helperText}>
                      Browse {favoritesFilter === 'products' ? 'products' : favoritesFilter === 'activities' ? 'activities' : 'items'} and click the heart icon to add them to favorites.
                    </p>
                    <div className={styles.buttonGroup}>
                      <Link to="/products" className={styles.browseButton}>
                        Browse Products
                      </Link>
                      <Link to="/activities" className={styles.secondaryButton}>
                        Browse Activities
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className={styles.favoritesGrid}>
                    {filteredFavorites.map((item, index) => {
                      // Check if item has price property to determine if it's a product
                      console.log('Rendering favorite item:', item);
                      
                      if (item.price !== undefined && item.category !== undefined) {
                        // Product card
                        return (
                          <div key={`product-${item.id}-${index}`} className={styles.favoriteCard}>
                            <div className={styles.cardHeader}>
                              <span className={styles.typeBadge}>🛍️ Product</span>
                              <button
                                className={styles.favoriteButton}
                                onClick={() => handleFavoriteToggle(item.id, 'product', true)}
                                aria-label="Remove from favorites"
                              >
                                ❤️
                              </button>
                            </div>
                            <div className={styles.cardContent}>
                              <h3>{item.name || 'Untitled Product'}</h3>
                              <p className={styles.price}>${item.price?.toFixed(2) || '0.00'}</p>
                              <p className={styles.category}>{item.category || 'Uncategorized'}</p>
                              <p className={styles.description}>{item.description || 'No description available.'}</p>
                            </div>
                            <div className={styles.cardFooter}>
                              <span className={styles.owner}>By: {item.user?.username || 'Unknown'}</span>
                              <span className={`${styles.status} ${item.is_active ? styles.active : styles.inactive}`}>
                                {item.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <Link 
                              to={`/products/${item.id}`} 
                              className={styles.viewButton}
                              style={{display: 'block', marginTop: '1rem', textAlign: 'center'}}
                            >
                              View Product
                            </Link>
                          </div>
                        );
                      } else {
                        // Activity card
                        return (
                          <div key={`activity-${item.id}-${index}`} className={styles.favoriteCard}>
                            <div className={styles.cardHeader}>
                              <span className={styles.typeBadge}>📅 Activity</span>
                              <button
                                className={styles.favoriteButton}
                                onClick={() => handleFavoriteToggle(item.id, 'activity', true)}
                                aria-label="Remove from favorites"
                              >
                                ❤️
                              </button>
                            </div>
                            <div className={styles.cardContent}>
                              <h3>{item.title || item.name || 'Untitled Activity'}</h3>
                              <p className={styles.activityDate}>
                                📅 {item.date_time ? new Date(item.date_time).toLocaleDateString() : 'Date not set'}
                              </p>
                              <p className={styles.price}>${(item.price || 0).toFixed(2)}</p>
                              <p className={styles.description}>{item.description || item.details || 'No description available.'}</p>
                            </div>
                            <div className={styles.cardFooter}>
                              <span className={styles.status}>{item.status || 'Available'}</span>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
              </div>
            ) : (
              // Booked Activities Tab
              <div className={styles.bookedSection}>
                <div className={styles.sectionHeader}>
                  <h2>Booked Activities 🎫</h2>
                  <div className={styles.bookedStats}>
                    <span className={styles.statCount}>
                      {bookedActivities.length} {bookedActivities.length === 1 ? 'Booking' : 'Bookings'}
                    </span>
                  </div>
                </div>
                
                {loading ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading booked activities...</p>
                  </div>
                ) : bookedActivities.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🎫</div>
                    <p>You haven't booked any activities yet.</p>
                    <p className={styles.helperText}>Explore farm activities and book your spot!</p>
                    <Link to="/activities" className={styles.browseButton}>
                      Browse Activities
                    </Link>
                  </div>
                ) : (
                  <div className={styles.bookedGrid}>
                    {bookedActivities.map(activity => (
                      <div key={activity.id} className={styles.bookedCard}>
                        <div className={styles.cardHeader}>
                          <span className={styles.ticketBadge}>
                            🎫 Ticket: {activity.ticket_code}
                          </span>
                          <span className={`${styles.status} ${activity.status === 'Confirmed' ? styles.confirmed : styles.pending}`}>
                            {activity.status}
                          </span>
                        </div>
                        <div className={styles.cardContent}>
                          <h3>{activity.title}</h3>
                          <div className={styles.activityDetails}>
                            <div className={styles.detailItem}>
                              <span className={styles.detailIcon}>📅</span>
                              <span className={styles.detailText}>
                                {new Date(activity.date_time).toLocaleDateString()}
                              </span>
                            </div>
                            <div className={styles.detailItem}>
                              <span className={styles.detailIcon}>⏰</span>
                              <span className={styles.detailText}>
                                {new Date(activity.date_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            <div className={styles.detailItem}>
                              <span className={styles.detailIcon}>💰</span>
                              <span className={styles.detailText}>
                                ${activity.price.toFixed(2)} per person
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={styles.cardFooter}>
                          <button className={styles.viewButton}>
                            View Details
                          </button>
                          <button className={styles.cancelButton}>
                            Cancel Booking
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
};

export default Profile;