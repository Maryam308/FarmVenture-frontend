import { Link } from "react-router-dom";
import styles from "./NavBar.module.css";

const NavBar = ({ user, handleSignout }) => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContainer}>
        <Link to="/" className={styles.logo}>
          FarmVenture
        </Link>
        
        <ul className={styles.navLinks}>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/products">Products</Link>
          </li>
          <li>
            <Link to="/activities">Activities</Link>
          </li>
          <li>
            <Link to="/about">Our Story</Link>
          </li>
          
          {user ? (
            <>
              <li>
                <Link to="/profile">Profile</Link>
              </li>
              <li>
                <Link to="/" onClick={handleSignout}>
                  SignOut
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/signin">SignIn</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;