import styles from './AuthorInfo.module.css';
import ProfileIcon from '../../assets/images/profile.png';

const AuthorInfo = ({ content }) => {
  return (
    <div className={styles.container}>
      <img src={ProfileIcon} alt="User avatar" className={styles.avatar} />
      <section className={styles.info}>
        <p className={styles.username}>{content.user.username}</p>
        <div className={styles.dateInfo}>
          <p className={styles.dateText}>
            Listed on {new Date(content.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </p>
        </div>
      </section>
    </div>
  );
};

export default AuthorInfo;