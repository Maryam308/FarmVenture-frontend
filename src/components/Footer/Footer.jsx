import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3>FarmVenture</h3>
            <p className={styles.tagline}>
              Fresh from farm to table
            </p>
            <p className={styles.description}>
              Connecting farmers with customers through quality products and authentic experiences.
            </p>
          </div>

          <div className={styles.footerSection}>
            <h4>Quick Links</h4>
            <ul className={styles.footerLinks}>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/products">Products</Link></li>
              <li><Link to="/activities">Activities</Link></li>
              <li><Link to="/about">Our Story</Link></li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h4>Contact Us</h4>
            <ul className={styles.contactInfo}>
              <li>📍 Manama, Bahrain</li>
              <li>📧 info@farmventure.bh</li>
              <li>📞 +973 1234 5678</li>
              <li>🕒 Sun - Thu: 8AM - 6PM</li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>&copy; {currentYear} FarmVenture. All rights reserved.</p>
          <div className={styles.footerBottomLinks}>
            <a href="#">Privacy Policy</a>
            <span>•</span>
            <a href="#">Terms of Service</a>
            <span>•</span>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;