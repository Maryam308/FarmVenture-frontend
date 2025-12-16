import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
        await productService.deleteProduct(productId);
        // Navigate to products page after successful deletion
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
        const productData = await productService.getProduct(productId);
        setProduct(productData);
      } catch (err) {
        setError('Failed to load product details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId]);

  if (loading) return <Loading />;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!product) return <div>Product not found</div>;

  const canEditDelete = user && (user.role === 'admin' || product.user.id === user.id);

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
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default ProductDetails;