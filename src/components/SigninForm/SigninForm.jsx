import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authService from '../../services/authService';
import styles from './SigninForm.module.css';

const SigninForm = (props) => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const updateMessage = (msg) => {
    setMessage(msg);
  };

  const handleChange = (event) => {
    updateMessage('');
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const user = await authService.signin(formData);
      props.setUser(user);
      navigate('/');
    } catch (err) {
      updateMessage(err.message);
    }
  };

  return (
    <main className={styles.container}>
      <section className={styles.farmBackground}>
        <div className={styles.overlay}>
          <h1 className={styles.welcomeTitle}>Welcome Back to FarmVenture</h1>
          <p className={styles.welcomeText}>Sign in to explore farm products and activities</p>
        </div>
      </section>
      <section className={styles.formSection}>
        <form autoComplete="off" onSubmit={handleSubmit} className={styles.form}>
          <h1 className={styles.formTitle}>Sign In</h1>
          {message && <p className={styles.errorMessage}>{message}</p>}
          
          <div className={styles.formGroup}>
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              autoComplete="off"
              id="username"
              value={formData.username}
              name="username"
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              autoComplete="off"
              id="password"
              value={formData.password}
              name="password"
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.submitButton}>Sign In</button>
            <Link to="/" className={styles.cancelLink}>
              <button type="button" className={styles.cancelButton}>Cancel</button>
            </Link>
          </div>

          <div className={styles.signupPrompt}>
            <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
          </div>
        </form>
      </section>
    </main>
  );
};

export default SigninForm;