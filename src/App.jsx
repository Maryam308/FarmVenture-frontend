import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import NavBar from './components/NavBar/NavBar';
import Landing from './components/Landing/Landing';
import Dashboard from './components/Dashboard/Dashboard';
import SignupForm from './components/SignupForm/SignupForm';
import SigninForm from './components/SigninForm/SigninForm';
import HootList from './components/HootList/HootList';
import HootDetails from './components/HootDetails/HootDetails';
import HootForm from './components/HootForm/HootForm';
import CommentForm from './components/CommentForm/CommentForm';
import * as authService from '../src/services/authService';
import * as hootService from './services/hootService';

const App = () => {
  const [user, setUser] = useState(authService.getUser());
  const [hoots, setHoots] = useState([]);

  const navigate = useNavigate();

  const handleSignout = () => {
    authService.signout();
    setUser(null);
  };

  const handleAddHoot = async (hootFormData) => {
    const newHoot = await hootService.create(hootFormData);
    setHoots([...hoots, newHoot]);
    navigate('/hoots');
  };

  const handleDeleteHoot = async (hootId) => {
    const deletedHoot = await hootService.remove(hootId);
    setHoots(hoots.filter((hoot) => hoot._id !== deletedHoot._id));
    navigate('/hoots');
  };

  const handleUpdateHoot = async (hootId, hootFormData) => {
    const updatedHoot = await hootService.update(hootId, hootFormData);
    setHoots(hoots.map((hoot) => (hootId === hoot._id ? updatedHoot : hoot)));
    navigate(`/hoots/${hootId}`);
  };

  useEffect(() => {
    const getHoots = async () => {
      const hootData = await hootService.index();
      setHoots(hootData);
    };
    if (user) {
      getHoots();
    };
  }, [user]);

  return (
    <>
      <NavBar user={user} handleSignout={handleSignout} />
      <Routes>
        { user ? (
          <>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/hoots" element={<HootList hoots={hoots} />} />
          <Route path="/hoots/:hootId" element={<HootDetails user={user} handleDeleteHoot={handleDeleteHoot} />} />
          <Route path="/hoots/new" element={<HootForm handleAddHoot={handleAddHoot} />} />
          <Route path="/hoots/:hootId/edit" element={<HootForm handleUpdateHoot={handleUpdateHoot} />} />
          <Route path="/hoots/:hootId/comments/:commentId/edit" element={<CommentForm />} />
          </>
        ) : (
          <Route path="/" element={<Landing />} />
        )}
        <Route path='/signup' element={<SignupForm setUser={setUser} />} />
        <Route path='/signin' element={<SigninForm setUser={setUser} />} />
      </Routes>
    </>
  );
};

export default App;