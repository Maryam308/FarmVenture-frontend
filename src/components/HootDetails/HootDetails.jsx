import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AuthorInfo from '../../components/AuthorInfo/AuthorInfo';
import CommentForm from '../CommentForm/CommentForm';
import * as commentService from '../../services/commentService';
import * as hootService from '../../services/hootService';
import { Link } from 'react-router-dom';
import styles from './HootDetails.module.css';
import Loading from '../Loading/Loading';
import Icon from '../Icon/Icon';

const HootDetails = ({ user, handleDeleteHoot }) => {
    const { hootId } = useParams();
    const [hoot, setHoot] = useState(null);
    const [trigger, setTrigger] = useState(true);

    const handleAddComment = async (commentFormData) => {
      const newComment = await commentService.create(hootId, commentFormData);
      setHoot({...hoot, comments: [...hoot.comments, newComment]});
      setTrigger(!trigger);
    };

    const handleDeleteComment = async (commentId) => {
      const deletedComment = await commentService.remove(hootId, commentId);
      setHoot({...hoot, comments: hoot.comments.filter((comment) => comment._id !== commentId)});
    };

    useEffect(() => {
        const getHoot = async () => {
          const hootData = await hootService.show(hootId);
          setHoot(hootData);
        };
        getHoot();
    }, [hootId, trigger]);

    if (!hoot) return <Loading />
    
    return (
        <main className={styles.container}>
          <section>
            <header>
              <p>{hoot.category.toUpperCase()}</p>
              <h1>{hoot.title}</h1>
              <div>
              <AuthorInfo content={hoot} />
                {hoot.user.id === user.id && (<><Link to={`/hoots/${hootId}/edit`}>
                  <Icon category="Edit" />
                </Link></>)}
                {hoot.user.id === user.id && (<><button onClick={() => handleDeleteHoot(hootId)}>
                  <Icon category="Trash" />
                </button></>)}  
              </div>         
            </header>
            <p>{hoot.text}</p>
          </section>
          <section>
            <h2>Comments</h2>
            <CommentForm handleAddComment={handleAddComment} />
            {!hoot.comments.length && <p>There are no comments.</p>}
            {hoot.comments.map((comment) => (
                <article key={comment._id}>
                <header>
                <div>
                <AuthorInfo content={comment} />
                {comment.user === user.id && (
                  <>
                    <Link to={`/hoots/${hootId}/comments/${comment._id}/edit`}>
                      <Icon category="Edit" />
                    </Link>
                    <button onClick={() => {handleDeleteComment(comment._id)}}>
                      <Icon category="Trash" />
                    </button>
                  </>
                )}
                </div>
                </header>
                <p>{comment.text}</p>
                </article>
            ))}
          </section>
        </main>
    );
};
  
export default HootDetails;