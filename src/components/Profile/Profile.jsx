import { useState, useEffect } from 'react';
import * as productService from '../../services/productService';
import styles from './Profile.module.css';

const Profile = ({ user }) => {
  const [userProducts, setUserProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProducts = async () => {
      try {
        const products = await productService.getUserProducts(user.id);
        setUserProducts(products);
      } catch (error) {
        console.error('Error fetching user products:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserProducts();
    }
  }, [user]);

  return (
    <main className={styles.container}>
      <section className={styles.profileHeader}>
        <h1>Your Profile</h1>
        <div className={styles.userInfo}>
          <h2>{user.username}</h2>
          <p>{user.email}</p>
          <span className={`${styles.role} ${user.role === 'admin' ? styles.admin : styles.customer}`}>
            {user.role.toUpperCase()}
          </span>
        </div>
      </section>

      <section className={styles.productsSection}>
        <h2>Your Products ({userProducts.length})</h2>
        
        {loading ? (
          <p>Loading your products...</p>
        ) : userProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <p>You haven't listed any products yet.</p>
            <a href="/products/new" className={styles.addButton}>
              Add Your First Product
            </a>
          </div>
        ) : (
          <div className={styles.productsGrid}>
            {userProducts.map(product => (
              <div key={product.id} className={styles.productCard}>
                {product.image_url && (
                  <img src={product.image_url} alt={product.name} className={styles.productImage} />
                )}
                <div className={styles.productInfo}>
                  <h3>{product.name}</h3>
                  <p className={styles.price}>${product.price.toFixed(2)}</p>
                  <p className={styles.category}>{product.category}</p>
                  <span className={`${styles.status} ${product.is_active ? styles.active : styles.inactive}`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Profile;