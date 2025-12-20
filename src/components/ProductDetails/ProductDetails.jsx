import { useState, useEffect } from 'react';  
import { Link, useParams, useNavigate } from 'react-router-dom';
import AuthorInfo from '../AuthorInfo/AuthorInfo';
import HeroSection from '../HeroSection/HeroSection';
import * as productService from '../../services/productService';
import * as favoriteService from '../../services/favoriteService';
import styles from './ProductDetails.module.css';
import Loading from '../Loading/Loading';
import PopupAlert from '../PopupAlert/PopupAlert';

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
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleDeleteClick = () => {
    setShowDeletePopup(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await handleDeleteProduct(productId);
      setSuccessMessage('Product deleted successfully!');
      setShowSuccessPopup(true);
      setTimeout(() => {
        navigate('/products');
      }, 2000);
    } catch (err) {
      setErrorMessage('Failed to delete product: ' + err.message);
      setShowErrorPopup(true);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!user || user.role !== 'customer') {
      setIsFavorited(false);
      setLoadingFavorite(false);
      return;
    }
    
    try {
      setLoadingFavorite(true);
      const response = await favoriteService.checkFavorite(productId, 'product');
      setIsFavorited(response.is_favorited);
    } catch (error) {
      setIsFavorited(false);
    } finally {
      setLoadingFavorite(false);
    }
  };

  const broadcastFavoriteUpdate = () => {
    localStorage.setItem('favorites_updated', Date.now().toString());
    window.dispatchEvent(new Event('favoriteUpdated'));
  };

  const handleFavoriteToggle = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (user.role !== 'customer') {
      return;
    }
    
    try {
      if (isFavorited) {
        await favoriteService.removeFavorite(productId, 'product');
        setIsFavorited(false);
      } else {
        await favoriteService.addFavorite(productId, 'product');
        setIsFavorited(true);
      }
      
      broadcastFavoriteUpdate();
    } catch (error) {
      setErrorMessage('Failed to update favorite: ' + error.message);
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
        setErrorMessage('Failed to load product details');
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

    window.addEventListener('favoriteUpdated', handleFavoriteUpdate);

    return () => {
      window.removeEventListener('favoriteUpdated', handleFavoriteUpdate);
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

  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';
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
                  <span>📷</span>
                  <p>No Image Available</p>
                </div>
              )}
              
              {!product.is_active && (
                <div className={styles.inactiveBadge}>INACTIVE</div>
              )}
              
              {isCustomer && (
                <button
                  className={`${styles.favoriteButton} ${isFavorited ? styles.favorited : ''}`}
                  onClick={handleFavoriteToggle}
                  aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                  disabled={loadingFavorite}
                >
                  {isFavorited ? '❤️' : '🤍'}
                </button>
              )}
            </div>

            {/* RIGHT: Details */}
            <div className={styles.detailsContainer}>
              <div className={styles.categorySection}>
                <span className={styles.category}>{product.category.toUpperCase()}</span>
                <span className={`${styles.status} ${product.is_active ? styles.active : styles.inactive}`}>
                  {product.is_active ? '✓ Active' : '✗ Inactive'}
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
                    <div className={styles.infoIcon}>🏷️</div>
                    <div>
                      <strong>Category:</strong>
                      <span>{product.category}</span>
                    </div>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>📊</div>
                    <div>
                      <strong>Status:</strong>
                      <span className={product.is_active ? styles.statusActive : styles.statusInactive}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>📅</div>
                    <div>
                      <strong>Listed On:</strong>
                      <span>{new Date(product.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>🔄</div>
                    <div>
                      <strong>Last Updated:</strong>
                      <span>{new Date(product.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>👤</div>
                    <div>
                      <strong>Owner:</strong>
                      <span>{product.user.username}</span>
                    </div>
                  </div>
                  
                  {isAdmin && !product.is_active && (
                    <div className={styles.infoItem}>
                      <div className={styles.infoIcon}>⚠️</div>
                      <div>
                        <strong>Admin Note:</strong>
                        <span className={styles.adminNote}>Product is inactive and hidden from public view</span>
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
                  <Link to={`/products/${productId}/edit`} className={styles.editButton}>
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
                      productService.toggleProductActive(product.id, true)
                        .then(() => {
                          window.location.reload();
                        })
                        .catch(err => {
                          setErrorMessage('Failed to activate product: ' + err.message);
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