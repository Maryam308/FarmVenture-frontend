import { Link } from 'react-router-dom';
import styles from './ProductList.module.css';
import AuthorInfo from '../AuthorInfo/AuthorInfo';

const ProductList = ({ products }) => {
  return (
    <main className={styles.container}>
      <h1>Farm Products</h1>
      {products.length === 0 ? (
        <p>No products available. Be the first to add one!</p>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => (
            <Link key={product.id} to={`/products/${product.id}`} className={styles.productCard}>
              <article>
                {product.image_url && (
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className={styles.productImage}
                  />
                )}
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
                    <span className={styles.status}>
                      {product.is_active ? 'Available' : 'Unavailable'}
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