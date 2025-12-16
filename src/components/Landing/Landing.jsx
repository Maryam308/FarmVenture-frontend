import { Link } from 'react-router-dom';
import styles from './Landing.module.css';

const Landing = () => {
  return (
    <main className={styles.container}>
      <section className={styles.hero}>
        <h1>Welcome to FarmVenture 🌱</h1>
        <p className={styles.subtitle}>
          Your local marketplace for fresh farm products directly from farmers.
        </p>
        <div className={styles.ctaButtons}>
          <Link to="/signup" className={styles.primaryButton}>
            Join FarmVenture
          </Link>
          <Link to="/products" className={styles.secondaryButton}>
            Browse Products
          </Link>
        </div>
      </section>

      <section className={styles.features}>
        <h2>Why Choose FarmVenture?</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🌾</div>
            <h3>Direct from Farm</h3>
            <p>Connect directly with local farmers for the freshest produce.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💰</div>
            <h3>Fair Prices</h3>
            <p>Better prices for both farmers and customers without middlemen.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🤝</div>
            <h3>Community Focused</h3>
            <p>Support your local farming community and sustainable agriculture.</p>
          </div>
        </div>
      </section>

      <section className={styles.howItWorks}>
        <h2>How It Works</h2>
        <div className={styles.steps}>
          <div className={styles.step}>
            <span className={styles.stepNumber}>1</span>
            <h3>Browse Products</h3>
            <p>Explore fresh farm products in your area</p>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNumber}>2</span>
            <h3>Create Account</h3>
            <p>Sign up as a buyer or seller</p>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNumber}>3</span>
            <h3>Connect & Trade</h3>
            <p>Start buying or selling farm products</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Landing;