// src/components/ProductDetails/ProductDetails.jsx
import { useState, useEffect } from 'react';  
import { useParams, Link, useNavigate } from 'react-router-dom';
import AuthorInfo from '../AuthorInfo/AuthorInfo';
import * as productService from '../../services/productService';
import styles from './ProductDetails.module.css';
import Loading from '../Loading/Loading';

const ProductDetails = ({ user, handleDeleteProduct }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    if (window.confirm('⚠️ Are you sure you want to PERMANENTLY delete this product?\n\nThis action cannot be undone!')) {
      try {
        await handleDeleteProduct(productId);
        navigate('/products');
      } catch (err) {
        setError('Failed to delete product: ' + err.message);
        console.error('Delete error:', err);
      }
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let productData;
        if (user) {
          // If user is logged in, try to get any product (including inactive)
          productData = await productService.getAnyProduct(productId);
        } else {
          // If not logged in, only get active products
          productData = await productService.getProduct(productId);
        }
        
        setProduct(productData);
      } catch (err) {
        console.error('Fetch product error:', err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId, user]);

  if (loading) return <Loading />;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!product) return <div className={styles.error}>Product not found</div>;

  // Check permissions - Only admins can edit/delete
  const isAdmin = user?.role === 'admin';
  const canEditDelete = isAdmin; // Only admins can edit/delete
  const canViewInactive = isAdmin || product.is_active;

  // If product is inactive and user cannot view it, show not found
  if (!product.is_active && !canViewInactive) {
    return (
      <main className={styles.container}>
        <div className={styles.error}>
          <h2>Product Not Available</h2>
          <p>This product is currently inactive and cannot be viewed.</p>
          <Link to="/products" className={styles.backLink}>
            ← Back to Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.productWrapper}>
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
              <span>📷</span>
              <p>No Image Available</p>
            </div>
          )}
          {!product.is_active && (
            <div className={styles.inactiveOverlay}>
              <span className={styles.inactiveText}>INACTIVE</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className={styles.detailsContainer}>
          <header className={styles.header}>
            <div className={styles.categorySection}>
              <span className={styles.category}>{product.category.toUpperCase()}</span>
              <span className={`${styles.status} ${product.is_active ? styles.active : styles.inactive}`}>
                {product.is_active ? '✓ Active' : '✗ Inactive'}
              </span>
            </div>
            
            <h1>{product.name}</h1>
            
            <div className={styles.authorActions}>
              <AuthorInfo content={product} />
              {canEditDelete && (
                <div className={styles.actionButtons}>
                  <Link to={`/products/${productId}/edit`} className={styles.editButton}>
                    Edit
                  </Link>
                  <button 
                    onClick={handleDelete} 
                    className={styles.deleteButton}
                  >
                    Delete Permanently
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Price Section */}
          <div className={styles.priceSection}>
            <h2 className={styles.price}>${product.price.toFixed(2)}</h2>
          </div>

          {/* Description */}
          <section className={styles.descriptionSection}>
            <h3>Description</h3>
            <p>{product.description}</p>
          </section>

          {/* Product Information */}
          <section className={styles.infoSection}>
            <h3>Product Information</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <strong>Category:</strong>
                <span>{product.category}</span>
              </div>
              <div className={styles.infoItem}>
                <strong>Status:</strong>
                <span className={product.is_active ? styles.statusActive : styles.statusInactive}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <strong>Listed On:</strong>
                <span>{new Date(product.created_at).toLocaleDateString()}</span>
              </div>
              <div className={styles.infoItem}>
                <strong>Last Updated:</strong>
                <span>{new Date(product.updated_at).toLocaleDateString()}</span>
              </div>
              <div className={styles.infoItem}>
                <strong>Owner:</strong>
                <span>{product.user.username}</span>
              </div>
              {isAdmin && !product.is_active && (
                <div className={styles.infoItem}>
                  <strong>Admin Note:</strong>
                  <span className={styles.adminNote}>Product is inactive and hidden from public view</span>
                </div>
              )}
            </div>
          </section>
          
          {/* Admin Actions (for inactive products) */}
          {isAdmin && !product.is_active && (
            <section className={styles.adminActions}>
              <h3>Admin Actions</h3>
              <div className={styles.adminButtons}>
                <button
                  onClick={() => {
                    productService.toggleProductActive(product.id, true)
                      .then(() => {
                        // Refresh the product data
                        window.location.reload();
                      })
                      .catch(err => {
                        alert('Failed to activate product: ' + err.message);
                      });
                  }}
                  className={styles.activateButton}
                >
                  Activate Product
                </button>
                <p className={styles.adminNote}>
                  This product is currently hidden from regular users. 
                  Activate it to make it visible in the marketplace.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
};

export default ProductDetails;