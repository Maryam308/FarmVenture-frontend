// src/components/Dashboard/Dashboard.jsx
import { Link } from 'react-router-dom';
import styles from './Dashboard.module.css';

const Dashboard = ({ user }) => {
  return (
    <main className={styles.container}>
      <div className={styles.welcomeSection}>
        <h1>Welcome back, {user.username}! 👋</h1>
        <p className={styles.subtitle}>
          {user.role === 'admin' 
            ? 'Manage farm products and activities as an administrator.'
            : 'Browse farm products from local farmers.'}
        </p>
      </div>

      <div className={styles.quickActions}>
        <h2>Quick Actions</h2>
        <div className={styles.actionGrid}>
          {/* Only show "Add New Product" for admins */}
          {user.role === 'admin' && (
            <Link to="/products/new" className={styles.actionCard}>
              <div className={styles.actionIcon}>➕</div>
              <h3>Add New Product</h3>
              <p>List a new farm product for sale</p>
            </Link>
          )}
          
          <Link to="/products" className={styles.actionCard}>
            <div className={styles.actionIcon}>📦</div>
            <h3>Browse Products</h3>
            <p>View all available products</p>
          </Link>
          
          <Link to="/profile" className={styles.actionCard}>
            <div className={styles.actionIcon}>👤</div>
            <h3>Your Profile</h3>
            <p>View and manage your account</p>
          </Link>
        </div>
      </div>

      <div className={styles.statsSection}>
        <h2>FarmVenture Platform</h2>
        <p className={styles.statsDescription}>
          {user.role === 'admin'
            ? 'Welcome to FarmVenture Admin Panel. Manage all products and activities on the platform.'
            : 'Welcome to FarmVenture - your marketplace for fresh farm products. Browse products from local farmers.'}
        </p>
      </div>
    </main>
  );
};

export default Dashboard;