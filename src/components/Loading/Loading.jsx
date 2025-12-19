import styles from './Loading.module.css';
import LoadingIcon from '../../assets/images/loading.svg';

const Loading = () => {
  return (
    <main className={styles.container}>
      <div className={styles.loadingWrapper}>
        <img src={LoadingIcon} alt="Loading" className={styles.loadingIcon} />
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Loading...</p>
      </div>
    </main>
  );
};

export default Loading;