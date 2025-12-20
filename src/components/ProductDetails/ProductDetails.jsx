import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import AuthorInfo from "../AuthorInfo/AuthorInfo";
import HeroSection from "../HeroSection/HeroSection";
import * as productService from "../../services/productService";
import * as favoriteService from "../../services/favoriteService";
import styles from "./ProductDetails.module.css";
import Loading from "../Loading/Loading";
import PopupAlert from "../PopupAlert/PopupAlert";

const ProductDetails = ({ user, handleDeleteProduct }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(true);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleDeleteClick = () => {
    setShowDeletePopup(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await handleDeleteProduct(productId);
      setSuccessMessage("Product deleted successfully!");
      setShowSuccessPopup(true);
      setTimeout(() => {
        navigate("/products");
      }, 2000);
    } catch (err) {
      setErrorMessage("Failed to delete product: " + err.message);
      setShowErrorPopup(true);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!user || user.role !== "customer") {
      setIsFavorited(false);
      setLoadingFavorite(false);
      return;
    }

    try {
      setLoadingFavorite(true);
      const response = await favoriteService.checkFavorite(
        productId,
        "product"
      );
      setIsFavorited(response.is_favorited);
    } catch (error) {
      setIsFavorited(false);
    } finally {
      setLoadingFavorite(false);
    }
  };

  const broadcastFavoriteUpdate = () => {
    localStorage.setItem("favorites_updated", Date.now().toString());
    window.dispatchEvent(new Event("favoriteUpdated"));
  };

  const handleFavoriteToggle = async () => {
    if (!user) {
      navigate("/signin");
      return;
    }

    if (user.role !== "customer") {
      return;
    }

    try {
      if (isFavorited) {
        await favoriteService.removeFavorite(productId, "product");
        setIsFavorited(false);
      } else {
        await favoriteService.addFavorite(productId, "product");
        setIsFavorited(true);
      }

      broadcastFavoriteUpdate();
    } catch (error) {
      setErrorMessage("Failed to update favorite: " + error.message);
      setShowErrorPopup(true);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        let productData;
        if (user) {
          productData = await productService.getAnyProduct(productId);
        } else {
          productData = await productService.getProduct(productId);
        }

        setProduct(productData);
      } catch (err) {
        setErrorMessage("Failed to load product details");
        setShowErrorPopup(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    checkFavoriteStatus();
  }, [productId, user]);

  useEffect(() => {
    const handleFavoriteUpdate = () => {
      checkFavoriteStatus();
    };

    window.addEventListener("favoriteUpdated", handleFavoriteUpdate);

    return () => {
      window.removeEventListener("favoriteUpdated", handleFavoriteUpdate);
    };
  }, []);

  if (loading) return <Loading />;

  if (!product) {
    return (
      <main className={styles.container}>
        <HeroSection title="FarmVenture" height="300px" />
        <div className={styles.contentSection}>
          <div className={styles.error}>Product not found</div>
        </div>
      </main>
    );
  }

  const isAdmin = user?.role === "admin";
  const isCustomer = user?.role === "customer";
  const canEditDelete = isAdmin;
  const canViewInactive = isAdmin || product.is_active;

  if (!product.is_active && !canViewInactive) {
    return (
      <main className={styles.container}>
        <HeroSection title="FarmVenture" height="300px" />
        <div className={styles.contentSection}>
          <div className={styles.error}>
            <h2>Product Not Available</h2>
            <p>This product is currently inactive and cannot be viewed.</p>
            <Link to="/products" className={styles.backLink}>
              ← Back to Products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <PopupAlert
        isOpen={showDeletePopup}
        onClose={() => setShowDeletePopup(false)}
        title="Delete Product"
        message="Are you sure you want to permanently delete this product? This action cannot be undone."
        type="warning"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        showCancel={true}
        onConfirm={handleDeleteConfirm}
      />

      <PopupAlert
        isOpen={showErrorPopup}
        onClose={() => setShowErrorPopup(false)}
        title="Error"
        message={errorMessage}
        type="error"
        confirmText="OK"
        showCancel={false}
      />

      <PopupAlert
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title="Success"
        message={successMessage}
        type="success"
        confirmText="OK"
        showCancel={false}
        autoClose={true}
        autoCloseTime={2000}
      />

      <HeroSection title="FarmVenture" height="300px" />

      <div className={styles.contentSection}>
        <div className={styles.productWrapper}>
          {/* Image on Left, Details on Right */}
          <div className={styles.topSection}>
            {/* LEFT: Image */}
            <div className={styles.imageContainer}>
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className={styles.productImage}
                />
              ) : (
                <div className={styles.noImage}>
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="lucide lucide-camera-icon lucide-camera"
                    >
                      <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                  </span>
                  <p>No Image Available</p>
                </div>
              )}

              {!product.is_active && (
                <div className={styles.inactiveBadge}>INACTIVE</div>
              )}

              {isCustomer && (
                <button
                  className={`${styles.favoriteButton} ${
                    isFavorited ? styles.favorited : ""
                  }`}
                  onClick={handleFavoriteToggle}
                  aria-label={
                    isFavorited ? "Remove from favorites" : "Add to favorites"
                  }
                  disabled={loadingFavorite}
                >
                  {isFavorited ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="red"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="lucide lucide-heart-icon lucide-heart"
                    >
                      <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="lucide lucide-heart-icon lucide-heart"
                    >
                      <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
                    </svg>
                  )}
                </button>
              )}
            </div>

            {/* RIGHT: Details */}
            <div className={styles.detailsContainer}>
              <div className={styles.categorySection}>
                <span className={styles.category}>
                  {product.category.toUpperCase()}
                </span>
                <span
                  className={`${styles.status} ${
                    product.is_active ? styles.active : styles.inactive
                  }`}
                >
                  {product.is_active ? "✓ Active" : "✗ Inactive"}
                </span>
              </div>

              <h1>{product.name}</h1>

              <div className={styles.priceSection}>
                <h2 className={styles.price}>BHD {product.price.toFixed(2)}</h2>
              </div>

              <section className={styles.infoSection}>
                <h3>Product Information</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-tag-icon lucide-tag"
                      >
                        <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                        <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
                      </svg>
                    </div>
                    <div>
                      <strong>Category:</strong>
                      <span>{product.category}</span>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-chart-column-icon lucide-chart-column"
                      >
                        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                        <path d="M18 17V9" />
                        <path d="M13 17V5" />
                        <path d="M8 17v-3" />
                      </svg>
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <span
                        className={
                          product.is_active
                            ? styles.statusActive
                            : styles.statusInactive
                        }
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-chart-column-icon lucide-chart-column"
                      >
                        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                        <path d="M18 17V9" />
                        <path d="M13 17V5" />
                        <path d="M8 17v-3" />
                      </svg>
                    </div>
                    <div>
                      <strong>Listed On:</strong>
                      <span>
                        {new Date(product.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-rotate-ccw-icon lucide-rotate-ccw"
                      >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                    </div>
                    <div>
                      <strong>Last Updated:</strong>
                      <span>
                        {new Date(product.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-user-round-icon lucide-user-round"
                      >
                        <circle cx="12" cy="8" r="5" />
                        <path d="M20 21a8 8 0 0 0-16 0" />
                      </svg>
                    </div>
                    <div>
                      <strong>Owner:</strong>
                      <span>{product.user.username}</span>
                    </div>
                  </div>

                  {isAdmin && !product.is_active && (
                    <div className={styles.infoItem}>
                      <div className={styles.infoIcon}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          class="lucide lucide-triangle-alert-icon lucide-triangle-alert"
                        >
                          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                          <path d="M12 9v4" />
                          <path d="M12 17h.01" />
                        </svg>
                      </div>
                      <div>
                        <strong>Admin Note:</strong>
                        <span className={styles.adminNote}>
                          Product is inactive and hidden from public view
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <div className={styles.authorActions}>
                <AuthorInfo content={product} />
              </div>

              {canEditDelete && (
                <div className={styles.actionButtons}>
                  <Link
                    to={`/products/${productId}/edit`}
                    className={styles.editButton}
                  >
                    Edit Product
                  </Link>
                  <button
                    onClick={handleDeleteClick}
                    className={styles.deleteButton}
                  >
                    Delete Product
                  </button>
                </div>
              )}

              {isAdmin && !product.is_active && (
                <div className={styles.adminActionsInline}>
                  <button
                    onClick={() => {
                      productService
                        .toggleProductActive(product.id, true)
                        .then(() => {
                          window.location.reload();
                        })
                        .catch((err) => {
                          setErrorMessage(
                            "Failed to activate product: " + err.message
                          );
                          setShowErrorPopup(true);
                        });
                    }}
                    className={styles.activateButton}
                  >
                    Activate Product
                  </button>
                  <p className={styles.adminNoteText}>
                    This product is currently hidden from regular users.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM: Description */}
          <section className={styles.descriptionSection}>
            <h3>Description</h3>
            <p>{product.description}</p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default ProductDetails;
