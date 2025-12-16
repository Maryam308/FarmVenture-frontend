import { Link } from 'react-router-dom';
import styles from './HootList.module.css';
import Icon from '../Icon/Icon';
import AuthorInfo from '../../components/AuthorInfo/AuthorInfo';

const HootList = ({hoots}) => {
    return (
        <main className={styles.container}>
        {hoots.map((hoot) => (
            <Link key={hoot.id} to={`/hoots/${hoot.id}`}>
              <article>
                <header>
                <div>
                  <h2>{hoot.title}</h2>
                  <Icon category={hoot.category} />
                </div>
                  <AuthorInfo content={hoot} />
                </header>
                <p>{hoot.text}</p>
              </article>
            </Link>
        ))}
        </main>
    );
};
  
export default HootList;