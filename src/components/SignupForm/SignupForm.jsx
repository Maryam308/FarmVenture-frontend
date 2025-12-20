import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as authService from "../../services/authService";
import styles from "./SignupForm.module.css";

const SignupForm = (props) => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    passwordConf: "",
  });

  const updateMessage = (msg) => {
    setMessage(msg);
  };

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const newUserResponse = await authService.signup(formData);
      props.setUser(newUserResponse.user);
      navigate("/");
    } catch (err) {
      updateMessage(err.message);
    }
  };

  const { username, email, password, passwordConf } = formData;
  
  const isFormInvalid = () => {
    return !(username && email && password && password === passwordConf);
  };

  return (
    <main className={styles.container}>
      <section className={styles.farmBackground}>
        <div className={styles.overlay}>
          <h1 className={styles.welcomeTitle}>Join FarmVenture</h1>
          <p className={styles.welcomeText}>Create an account to discover farm products and activities</p>
        </div>
      </section>
      <section className={styles.formSection}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <h1 className={styles.formTitle}>Sign Up</h1>
          {message && <p className={styles.errorMessage}>{message}</p>}
          
          <div className={styles.formGroup}>
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              name="username"
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              name="email"
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              name="password"
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="confirm">Confirm Password:</label>
            <input
              type="password"
              id="confirm"
              value={passwordConf}
              name="passwordConf"
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.buttonGroup}>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isFormInvalid()}
            >
              Sign Up
            </button>
            <Link to="/" className={styles.cancelLink}>
              <button type="button" className={styles.cancelButton}>Cancel</button>
            </Link>
          </div>

          <div className={styles.signinPrompt}>
            <p>Already have an account? <Link to="/signin">Sign In</Link></p>
          </div>
        </form>
      </section>
    </main>
  );
};

export default SignupForm;