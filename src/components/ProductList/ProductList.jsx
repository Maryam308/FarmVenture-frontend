import { Link } from 'react-router-dom';
import styles from './ProductList.module.css';
import AuthorInfo from '../AuthorInfo/AuthorInfo';

const ProductList = ({ products }) => {
  return (
    <main className={styles.container}>
      <h1>Farm Products</h1>
      {products.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No products available. Be the first to add one!</p>
          <Link to="/products/new" className={styles.addButton}>
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => (
            <Link key={product.id} to={`/products/${product.id}`} className={styles.productCard}>
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
                    <div className={styles.inactiveBadge}>Inactive</div>
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
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
};

export default ProductList;