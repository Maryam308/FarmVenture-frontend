// src/components/Profile/Profile.jsx
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import * as productService from "../../services/productService";
import * as favoriteService from "../../services/favoriteService";
import * as bookingService from "../../services/bookingService";
import * as activityService from "../../services/activitiesService";
import styles from "./Profile.module.css";

const Profile = ({ user }) => {
  const [activeTab, setActiveTab] = useState(
    user?.role === "admin" ? "products" : "bookings"
  );
  const [userProducts, setUserProducts] = useState([]);
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [favoriteActivities, setFavoriteActivities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [error, setError] = useState(null);

  // State for admin filter
  const [statusFilter, setStatusFilter] = useState("active");

  // State for favorites filter (for customers)
  const [favoritesFilter, setFavoritesFilter] = useState("all");

  // Fetch real favorites from API
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      console.log("No user for fetchFavorites");
      return;
    }

    try {
      setLoadingFavorites(true);
      console.log("Profile: Fetching favorites for user:", user);

      // Use getFavorites to get full details
      const allFavorites = await favoriteService.getFavorites();
      console.log("Profile: Received favorites data:", allFavorites);

      // Separate products and activities
      const products = [];
      const activities = [];

      allFavorites.forEach((fav, index) => {
        if (fav.item_type === "product") {
          if (fav.item) {
            products.push({
              ...fav.item,
              favorite_id: fav.id,
              favorited_at: fav.created_at,
            });
          }
        } else if (fav.item_type === "activity") {
          if (fav.item) {
            activities.push({
              ...fav.item,
              favorite_id: fav.id,
              favorited_at: fav.created_at,
            });
          }
        }
      });

      setFavoriteProducts(products);
      setFavoriteActivities(activities);
    } catch (error) {
      console.error("Profile: Error fetching favorites:", error);
      setFavoriteProducts([]);
      setFavoriteActivities([]);
    } finally {
      setLoadingFavorites(false);
    }
  }, [user]);

  // Fetch real bookings
  const fetchBookings = useCallback(async () => {
    if (!user) return;

    try {
      setLoadingBookings(true);
      console.log("Fetching bookings for user:", user);

      let bookingsData = [];

      if (user.role === "admin") {
        // Admin can see all bookings
        bookingsData = await bookingService.getAllBookingsAdmin();
      } else {
        // Customer can only see their own bookings
        bookingsData = await bookingService.getMyBookings();
      }

      console.log("Bookings fetched:", bookingsData);
      setBookings(bookingsData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [user]);

  // Cancel booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      await bookingService.cancelBooking(bookingId);
      alert("Booking cancelled successfully!");
      // Refresh bookings
      await fetchBookings();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert(error.message || "Failed to cancel booking");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Profile: User object:", user);

        if (!user) {
          console.log("Profile: No user found");
          setUserProducts([]);
          return;
        }

        if (user?.role === "admin") {
          // Admin can see all products (including inactive)
          console.log("Profile: Fetching all products for admin");
          const allProducts = await productService.getAllProductsAdmin(true);
          console.log("Profile: Admin products fetched:", allProducts.length);
          setUserProducts(allProducts);

          // Fetch admin bookings
          await fetchBookings();
        } else {
          // Regular users see only their own products including inactive
          console.log("Profile: Fetching user products for user:", user);

          // Get user ID
          const userId = user.id || user._id || user.userId;
          console.log("Profile: Extracted userId:", userId);

          if (!userId) {
            console.error("Profile: User ID not found in user object:", user);
            throw new Error("User ID not found in user object");
          }

          const allUserProducts = await productService.getAllUserProducts(
            userId
          );
          console.log(
            "Profile: User products fetched:",
            allUserProducts.length
          );
          setUserProducts(allUserProducts);

          // Fetch real favorites
          console.log("Profile: Starting to fetch favorites...");
          await fetchFavorites();

          // Fetch real bookings
          console.log("Profile: Starting to fetch bookings...");
          await fetchBookings();
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setError(error.message || "Failed to load profile data");
        setUserProducts([]);
        setFavoriteProducts([]);
        setFavoriteActivities([]);
        setBookings([]);
      } finally {
        console.log("Profile: Setting loading to false");
        setLoading(false);
      }
    };

    console.log("Profile: Component mounted, user:", user);
    if (user) {
      console.log("Profile: User detected, fetching data");
      fetchData();
    } else {
      console.log("Profile: No user, setting loading to false");
      setLoading(false);
    }
  }, [user, fetchFavorites, fetchBookings]);

  // Listen for favorite updates
  useEffect(() => {
    const handleFavoriteUpdate = () => {
      console.log("Profile: Favorite update event received");
      fetchFavorites();
    };

    window.addEventListener("favoriteUpdated", handleFavoriteUpdate);
    window.addEventListener("storage", handleFavoriteUpdate);

    return () => {
      window.removeEventListener("favoriteUpdated", handleFavoriteUpdate);
      window.removeEventListener("storage", handleFavoriteUpdate);
    };
  }, [fetchFavorites]);

  // Filter bookings based on status
  const filteredBookings = bookings.filter((booking) => {
    if (bookingStatusFilter === "all") return true;
    return booking.status === bookingStatusFilter;
  });

  // Filter products based on selected filter (admin only)
  const filteredProducts = userProducts.filter((product) => {
    if (statusFilter === "active") return product.is_active;
    if (statusFilter === "inactive") return !product.is_active;
    return true;
  });

  // Filter favorites based on selected filter (customer only)
  const getFilteredFavorites = () => {
    if (favoritesFilter === "products") {
      return favoriteProducts;
    } else if (favoritesFilter === "activities") {
      return favoriteActivities;
    } else {
      return [...favoriteProducts, ...favoriteActivities];
    }
  };

  const filteredFavorites = getFilteredFavorites();
  const activeCount = userProducts.filter((p) => p.is_active).length;
  const inactiveCount = userProducts.filter((p) => !p.is_active).length;
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
      localStorage.setItem("favorites_updated", Date.now().toString());
      window.dispatchEvent(new Event("favoriteUpdated"));

      // Refresh favorites
      await fetchFavorites();
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
          <Link to="/login" className={styles.browseButton}>
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <section className={styles.profileHeader}>
        <h1>Your Profile</h1>
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

      {/* Error Message */}
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

      {/* Tab Navigation */}
      <section className={styles.tabsSection}>
        <div className={styles.tabNav}>
          {user?.role === "admin" ? (
            // Admin tabs
            <>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "products" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("products")}
              >
                Products Management
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
                Activities Management
              </button>
            </>
          ) : (
            // Customer tabs
            <>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "favorites" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("favorites")}
              >
                <span className={styles.tabIcon}>❤️</span>
                My Favorites
              </button>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "bookings" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("bookings")}
              >
                <span className={styles.tabIcon}>🎫</span>
                My Bookings
              </button>
            </>
          )}
        </div>

        {user?.role === "admin" ? (
          // Admin content
          <>
            {activeTab === "products" ? (
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
            ) : activeTab === "bookings" ? (
              // Admin Bookings Management
              <div className={styles.bookingsSection}>
                <div className={styles.sectionHeader}>
                  <h2>All Bookings Management</h2>
                  <div className={styles.bookingsStats}>
                    <span className={styles.statTotal}>
                      {bookings.length} Total Bookings
                    </span>
                    <span className={styles.statUpcoming}>
                      {bookings.filter((b) => b.status === "upcoming").length}{" "}
                      Upcoming
                    </span>
                    <span className={styles.statToday}>
                      {bookings.filter((b) => b.status === "today").length}{" "}
                      Today
                    </span>
                    <span className={styles.statPast}>
                      {bookings.filter((b) => b.status === "past").length} Past
                    </span>
                  </div>
                </div>

                <div className={styles.filterControls}>
                  <div className={styles.filterGroup}>
                    <label
                      htmlFor="bookingStatusFilter"
                      className={styles.filterLabel}
                    >
                      Filter by Status:
                    </label>
                    <select
                      id="bookingStatusFilter"
                      value={bookingStatusFilter}
                      onChange={(e) => setBookingStatusFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="all">All Bookings</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="today">Today</option>
                      <option value="past">Past</option>
                    </select>
                  </div>
                  <div className={styles.adminNote}>
                    <p>
                      📊 As an admin, you can view and manage all customer
                      bookings.
                    </p>
                  </div>
                </div>

                {loadingBookings ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading bookings...</p>
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🎫</div>
                    <p>
                      {bookingStatusFilter === "all"
                        ? "No bookings found in the system."
                        : `No ${bookingStatusFilter} bookings found.`}
                    </p>
                  </div>
                ) : (
                  <div className={styles.bookingsGrid}>
                    {filteredBookings.map((booking) => (
                      <div key={booking.id} className={styles.bookingCard}>
                        <div className={styles.cardHeader}>
                          <span className={styles.bookingId}>
                            Booking #{booking.id}
                          </span>
                          {formatBookingStatus(booking.status)}
                          {user.role === "admin" && (
                            <span className={styles.customerInfo}>
                              Customer: {booking.user?.username || "Unknown"}
                            </span>
                          )}
                        </div>

                        <div className={styles.cardContent}>
                          <h3>
                            {booking.activity?.title || "Activity not found"}
                          </h3>

                          <div className={styles.bookingDetails}>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Date:</span>
                              <span className={styles.detailValue}>
                                {booking.activity?.date_time
                                  ? new Date(
                                      booking.activity.date_time
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Time:</span>
                              <span className={styles.detailValue}>
                                {booking.activity?.date_time
                                  ? new Date(
                                      booking.activity.date_time
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "N/A"}
                              </span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>
                                Tickets:
                              </span>
                              <span className={styles.detailValue}>
                                {booking.tickets_number}
                              </span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>
                                Price per ticket:
                              </span>
                              <span className={styles.detailValue}>
                                BHD{(booking.activity?.price || 0).toFixed(2)}
                              </span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Total:</span>
                              <span className={styles.detailValue}>
                                <strong>
                                  BHD
                                  {(
                                    (booking.activity?.price || 0) *
                                    booking.tickets_number
                                  ).toFixed(2)}
                                </strong>
                              </span>
                            </div>
                          </div>

                          <div className={styles.bookedInfo}>
                            <span className={styles.bookedAt}>
                              Booked on:{" "}
                              {new Date(booking.booked_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className={styles.cardFooter}>
                          {booking.activity && (
                            <Link
                              to={`/activities/${booking.activity.id}`}
                              className={styles.viewButton}
                            >
                              View Activity
                            </Link>
                          )}
                          <Link
                            to={`/bookings/${booking.id}`}
                            className={styles.detailsButton}
                          >
                            Booking Details
                          </Link>
                          {booking.status === "upcoming" &&
                            user.role === "admin" && (
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                className={styles.cancelButton}
                              >
                                Cancel as Admin
                              </button>
                            )}
                        </div>
                      </div>
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
                  <p className={styles.helperText}>
                    You'll be able to create and manage farm activities here.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          // Customer content
          <>
            {activeTab === "favorites" ? (
              <div className={styles.favoritesSection}>
                <div className={styles.sectionHeader}>
                  <h2>My Favorites ❤️</h2>
                  <div className={styles.favoritesStats}>
                    <span className={styles.statCount}>
                      {filteredFavorites.length}{" "}
                      {filteredFavorites.length === 1 ? "Item" : "Items"}
                    </span>
                  </div>
                </div>

                <div className={styles.filterControls}>
                  <div className={styles.filterGroup}>
                    <label
                      htmlFor="favoritesFilter"
                      className={styles.filterLabel}
                    >
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
                      {favoritesFilter === "all"
                        ? "You haven't favorited any items yet."
                        : favoritesFilter === "products"
                        ? "You haven't favorited any products yet."
                        : "You haven't favorited any activities yet."}
                    </p>
                    <p className={styles.helperText}>
                      Browse{" "}
                      {favoritesFilter === "products"
                        ? "products"
                        : favoritesFilter === "activities"
                        ? "activities"
                        : "items"}{" "}
                      and click the heart icon to add them to favorites.
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
                      if (
                        item.price !== undefined &&
                        item.category !== undefined
                      ) {
                        // Product card
                        return (
                          <div
                            key={`product-${item.id}-${index}`}
                            className={styles.favoriteCard}
                          >
                            <div className={styles.cardHeader}>
                              <span className={styles.typeBadge}>
                                🛍️ Product
                              </span>
                              <button
                                className={styles.favoriteButton}
                                onClick={() =>
                                  handleFavoriteToggle(item.id, "product", true)
                                }
                                aria-label="Remove from favorites"
                              >
                                ❤️
                              </button>
                            </div>
                            <div className={styles.cardContent}>
                              <h3>{item.name || "Untitled Product"}</h3>
                              <p className={styles.price}>
                                ${item.price?.toFixed(2) || "0.00"}
                              </p>
                              <p className={styles.category}>
                                {item.category || "Uncategorized"}
                              </p>
                              <p className={styles.description}>
                                {item.description ||
                                  "No description available."}
                              </p>
                            </div>
                            <div className={styles.cardFooter}>
                              <span className={styles.owner}>
                                By: {item.user?.username || "Unknown"}
                              </span>
                              <span
                                className={`${styles.status} ${
                                  item.is_active
                                    ? styles.active
                                    : styles.inactive
                                }`}
                              >
                                {item.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <Link
                              to={`/products/${item.id}`}
                              className={styles.viewButton}
                              style={{
                                display: "block",
                                marginTop: "1rem",
                                textAlign: "center",
                              }}
                            >
                              View Product
                            </Link>
                          </div>
                        );
                      } else {
                        // Activity card
                        return (
                          <div
                            key={`activity-${item.id}-${index}`}
                            className={styles.favoriteCard}
                          >
                            <div className={styles.cardHeader}>
                              <span className={styles.typeBadge}>
                                📅 Activity
                              </span>
                              <button
                                className={styles.favoriteButton}
                                onClick={() =>
                                  handleFavoriteToggle(
                                    item.id,
                                    "activity",
                                    true
                                  )
                                }
                                aria-label="Remove from favorites"
                              >
                                ❤️
                              </button>
                            </div>
                            <div className={styles.cardContent}>
                              <h3>
                                {item.title || item.name || "Untitled Activity"}
                              </h3>
                              <p className={styles.activityDate}>
                                📅{" "}
                                {item.date_time
                                  ? new Date(
                                      item.date_time
                                    ).toLocaleDateString()
                                  : "Date not set"}
                              </p>
                              <p className={styles.price}>
                                ${(item.price || 0).toFixed(2)}
                              </p>
                              <p className={styles.description}>
                                {item.description ||
                                  item.details ||
                                  "No description available."}
                              </p>
                            </div>
                            <div className={styles.cardFooter}>
                              <span className={styles.status}>
                                {item.status || "Available"}
                              </span>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
              </div>
            ) : (
              // Customer Bookings Tab
              <div className={styles.bookingsSection}>
                <div className={styles.sectionHeader}>
                  <h2>My Bookings 🎫</h2>
                  <div className={styles.bookingsStats}>
                    <span className={styles.statTotal}>
                      {bookings.length} Total Bookings
                    </span>
                    <span className={styles.statUpcoming}>
                      {bookings.filter((b) => b.status === "upcoming").length}{" "}
                      Upcoming
                    </span>
                    <span className={styles.statToday}>
                      {bookings.filter((b) => b.status === "today").length}{" "}
                      Today
                    </span>
                    <span className={styles.statPast}>
                      {bookings.filter((b) => b.status === "past").length} Past
                    </span>
                  </div>
                </div>

                <div className={styles.filterControls}>
                  <div className={styles.filterGroup}>
                    <label
                      htmlFor="bookingStatusFilter"
                      className={styles.filterLabel}
                    >
                      Filter by Status:
                    </label>
                    <select
                      id="bookingStatusFilter"
                      value={bookingStatusFilter}
                      onChange={(e) => setBookingStatusFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="all">All Bookings</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="today">Today</option>
                      <option value="past">Past</option>
                    </select>
                  </div>
                </div>

                {loadingBookings ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading bookings...</p>
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🎫</div>
                    <p>
                      {bookingStatusFilter === "all"
                        ? "You haven't booked any activities yet."
                        : `You don't have any ${bookingStatusFilter} bookings.`}
                    </p>
                    <p className={styles.helperText}>
                      Explore farm activities and book your spot!
                    </p>
                    <Link to="/activities" className={styles.browseButton}>
                      Browse Activities
                    </Link>
                  </div>
                ) : (
                  <div className={styles.bookingsGrid}>
                    {filteredBookings.map((booking) => (
                      <div key={booking.id} className={styles.bookingCard}>
                        <div className={styles.cardHeader}>
                          <span className={styles.bookingId}>
                            Booking #{booking.id}
                          </span>
                          {formatBookingStatus(booking.status)}
                        </div>

                        <div className={styles.cardContent}>
                          <h3>
                            {booking.activity?.title || "Activity not found"}
                          </h3>

                          <div className={styles.bookingDetails}>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Date:</span>
                              <span className={styles.detailValue}>
                                {booking.activity?.date_time
                                  ? new Date(
                                      booking.activity.date_time
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Time:</span>
                              <span className={styles.detailValue}>
                                {booking.activity?.date_time
                                  ? new Date(
                                      booking.activity.date_time
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "N/A"}
                              </span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>
                                Tickets:
                              </span>
                              <span className={styles.detailValue}>
                                {booking.tickets_number}
                              </span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>
                                Price per ticket:
                              </span>
                              <span className={styles.detailValue}>
                                BHD{(booking.activity?.price || 0).toFixed(2)}
                              </span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Total:</span>
                              <span className={styles.detailValue}>
                                <strong>
                                  BHD
                                  {(
                                    (booking.activity?.price || 0) *
                                    booking.tickets_number
                                  ).toFixed(2)}
                                </strong>
                              </span>
                            </div>
                          </div>

                          <div className={styles.bookedInfo}>
                            <span className={styles.bookedAt}>
                              Booked on:{" "}
                              {new Date(booking.booked_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className={styles.cardFooter}>
                          {booking.activity && (
                            <Link
                              to={`/activities/${booking.activity.id}`}
                              className={styles.viewButton}
                            >
                              View Activity
                            </Link>
                          )}
                          <Link
                            to={`/bookings/${booking.id}`}
                            className={styles.detailsButton}
                          >
                            Booking Details
                          </Link>
                          {booking.status === "upcoming" && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className={styles.cancelButton}
                            >
                              Cancel Booking
                            </button>
                          )}
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
