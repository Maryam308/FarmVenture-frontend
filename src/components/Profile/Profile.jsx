import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import * as bookingService from "../../services/bookingService";
import * as favoriteService from "../../services/favoriteService";
import HeroSection from "../HeroSection/HeroSection";
import styles from "./Profile.module.css";
import PopupAlert from "../PopupAlert/PopupAlert";

const Profile = ({ user }) => {
  const [activeTab, setActiveTab] = useState(
    user?.role === "admin" ? "bookings" : "favorites"
  );
  
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (user.role === "admin") {
          await fetchBookings();
        } else if (user.role === "customer") {
          const allFavorites = await favoriteService.getFavorites();
          const products = [];

          allFavorites.forEach((fav) => {
            if (fav.item_type === "product" && fav.item) {
              products.push({
                ...fav.item,
                favorite_id: fav.id,
                favorited_at: fav.created_at,
              });
            }
          });

          setFavoriteProducts(products);
          await fetchBookings();
        }
      } catch (error) {
        setError(error.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.sub, user?.role]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      let bookingsData = [];

      if (user.role === "admin") {
        bookingsData = await bookingService.getAllBookingsAdmin();
      } else {
        bookingsData = await bookingService.getMyBookings();
      }

      setBookings(bookingsData || []);
    } catch (error) {
      setBookings([]);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "customer") return;

    const handleFavoriteUpdate = async () => {
      try {
        const allFavorites = await favoriteService.getFavorites();
        const products = [];

        allFavorites.forEach((fav) => {
          if (fav.item_type === "product" && fav.item) {
            products.push({
              ...fav.item,
              favorite_id: fav.id,
              favorited_at: fav.created_at,
            });
          }
        });

        setFavoriteProducts(products);
      } catch (error) {}
    };

    window.addEventListener("favoriteUpdated", handleFavoriteUpdate);
    window.addEventListener("storage", handleFavoriteUpdate);

    return () => {
      window.removeEventListener("favoriteUpdated", handleFavoriteUpdate);
      window.removeEventListener("storage", handleFavoriteUpdate);
    };
  }, [user?.sub, user?.role]);

  useEffect(() => {
    if (!user) return;

    const handleBookingUpdate = () => {
      fetchBookings();
    };

    window.addEventListener("bookingCreated", handleBookingUpdate);
    window.addEventListener("bookingCancelled", handleBookingUpdate);

    return () => {
      window.removeEventListener("bookingCreated", handleBookingUpdate);
      window.removeEventListener("bookingCancelled", handleBookingUpdate);
    };
  }, [user]);

  const filteredBookings = (bookings || []).filter((booking) => {
    if (bookingStatusFilter === "all") return true;
    return booking.status === bookingStatusFilter;
  });

  const handleCancelBookingClick = (bookingId) => {
    setSelectedBookingId(bookingId);
    setPopupMessage("Are you sure you want to cancel this booking?");
    setShowCancelPopup(true);
  };

  const handleCancelBookingConfirm = async () => {
    if (!selectedBookingId) return;

    try {
      await bookingService.cancelBooking(selectedBookingId);
      setPopupMessage("Booking cancelled successfully!");
      setShowSuccessPopup(true);
      fetchBookings();
      setSelectedBookingId(null);
    } catch (error) {
      setPopupMessage(error.message || "Failed to cancel booking");
      setShowErrorPopup(true);
    }
  };

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
        <HeroSection title="FarmVenture" height="300px" />
        <div className={styles.contentSection}>
          <div className={styles.errorState}>
            <h2>Please Sign In</h2>
            <p>You need to be signed in to view this page.</p>
            <Link to="/signin" className={styles.browseButton}>
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <PopupAlert
        isOpen={showCancelPopup}
        onClose={() => setShowCancelPopup(false)}
        title="Cancel Booking"
        message={popupMessage}
        type="warning"
        confirmText="Yes, Cancel"
        cancelText="No, Keep Booking"
        showCancel={true}
        onConfirm={handleCancelBookingConfirm}
      />

      <PopupAlert
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title="Success"
        message={popupMessage}
        type="success"
        confirmText="OK"
        showCancel={false}
        autoClose={true}
        autoCloseTime={2000}
      />

      <PopupAlert
        isOpen={showErrorPopup}
        onClose={() => setShowErrorPopup(false)}
        title="Error"
        message={popupMessage}
        type="error"
        confirmText="OK"
        showCancel={false}
      />

      <HeroSection title="FarmVenture" height="300px" />

      <div className={styles.contentSection}>
        {/* ADMIN VIEW - Bookings Management Only */}
        {user?.role === "admin" ? (
          <>
            <div className={styles.pageHeader}>
              <h1>Bookings Management</h1>
              <p className={styles.subtitle}>
                Manage all customer bookings and activity reservations
              </p>
            </div>

            <div className={styles.statsCards}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📊</div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>
                    {(bookings || []).length}
                  </span>
                  <span className={styles.statLabel}>Total Bookings</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📅</div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>
                    {(bookings || []).filter((b) => b.status === "upcoming").length}
                  </span>
                  <span className={styles.statLabel}>Upcoming</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🎯</div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>
                    {(bookings || []).filter((b) => b.status === "today").length}
                  </span>
                  <span className={styles.statLabel}>Today</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>✅</div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>
                    {(bookings || []).filter((b) => b.status === "past").length}
                  </span>
                  <span className={styles.statLabel}>Completed</span>
                </div>
              </div>
            </div>

            <div className={styles.filterSection}>
              <label htmlFor="bookingStatusFilter" className={styles.filterLabel}>
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

            {loading ? (
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
                    </div>

                    <div className={styles.customerBadge}>
                      👤 {booking.user?.username || "Unknown Customer"}
                    </div>

                    <div className={styles.cardContent}>
                      <h3>{booking.activity?.title || "Activity not found"}</h3>

                      <div className={styles.bookingDetails}>
                        <div className={styles.detailRow}>
                          <span>📅 Date:</span>
                          <span>
                            {booking.activity?.date_time
                              ? new Date(
                                  booking.activity.date_time
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                        <div className={styles.detailRow}>
                          <span>🕐 Time:</span>
                          <span>
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
                          <span>🎫 Tickets:</span>
                          <span>{booking.tickets_number}</span>
                        </div>
                        <div className={styles.detailRow}>
                          <span>💰 Total:</span>
                          <span className={styles.totalPrice}>
                            BHD {(
                              (booking.activity?.price || 0) *
                              booking.tickets_number
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <Link
                        to={`/bookings/${booking.id}`}
                        className={styles.viewButton}
                      >
                        View Details
                      </Link>
                      {booking.status === "upcoming" && (
                        <button
                          onClick={() => handleCancelBookingClick(booking.id)}
                          className={styles.cancelButton}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* CUSTOMER VIEW - Profile with Tabs */
          <>
            <div className={styles.profileCard}>
              <h2>{user.role === "customer" ? "Customer" : "User"} Profile</h2>
            </div>

            <div className={styles.tabSection}>
              <div className={styles.tabButtons}>
                <button
                  className={`${styles.tabButton} ${
                    activeTab === "favorites" ? styles.active : ""
                  }`}
                  onClick={() => setActiveTab("favorites")}
                >
                  Favourites
                </button>
                <button
                  className={`${styles.tabButton} ${
                    activeTab === "bookings" ? styles.active : ""
                  }`}
                  onClick={() => setActiveTab("bookings")}
                >
                  Bookings
                </button>
              </div>

              {activeTab === "favorites" && (
                <div className={styles.tabContent}>
                  {loading ? (
                    <div className={styles.loadingState}>
                      <div className={styles.spinner}></div>
                      <p>Loading favorites...</p>
                    </div>
                  ) : favoriteProducts.length === 0 ? (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>❤️</div>
                      <p>You haven't favorited any products yet.</p>
                      <Link to="/products" className={styles.browseButton}>
                        Browse Products
                      </Link>
                    </div>
                  ) : (
                    <div className={styles.favoritesGrid}>
                      {favoriteProducts.map((product) => (
                        <Link
                          key={`product-${product.id}`}
                          to={`/products/${product.id}`}
                          className={styles.favoriteCard}
                        >
                          <div className={styles.imageContainer}>
                            {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.name} 
                                className={styles.productImage}
                              />
                            ) : (
                              <div className={styles.cardPlaceholder}>
                                <span>🌱</span>
                                <p>No Image</p>
                              </div>
                            )}
                          </div>
                          <div className={styles.cardInfo}>
                            <span className={styles.typeBadge}>
                              Product
                            </span>
                            <h3>
                              {product.name || "Untitled Product"}
                            </h3>
                            <p className={styles.price}>
                              BHD {product.price?.toFixed(2) || "0.00"}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "bookings" && (
                <div className={styles.tabContent}>
                  <div className={styles.filterSection}>
                    <label htmlFor="bookingStatusFilter" className={styles.filterLabel}>
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

                  {loading ? (
                    <div className={styles.loadingState}>
                      <div className={styles.spinner}></div>
                      <p>Loading bookings...</p>
                    </div>
                  ) : filteredBookings.length === 0 ? (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>🎫</div>
                      <p>You haven't booked any activities yet.</p>
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
                                <span>Date:</span>
                                <span>
                                  {booking.activity?.date_time
                                    ? new Date(
                                        booking.activity.date_time
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </span>
                              </div>
                              <div className={styles.detailRow}>
                                <span>Tickets:</span>
                                <span>{booking.tickets_number}</span>
                              </div>
                            </div>
                          </div>
                          <div className={styles.cardFooter}>
                            <Link
                              to={`/bookings/${booking.id}`}
                              className={styles.viewButton}
                            >
                              View Details
                            </Link>
                            {booking.status === "upcoming" && (
                              <button
                                onClick={() =>
                                  handleCancelBookingClick(booking.id)
                                }
                                className={styles.cancelButton}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default Profile;