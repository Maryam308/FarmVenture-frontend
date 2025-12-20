import styles from './Loading.module.css';

const Loading = () => {
  return (
    <main className={styles.container}>
      <div className={styles.loadingWrapper}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Loading...</p>
      </div>
    </main>
  );
};

export default Loading;