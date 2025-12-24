import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectRoute from './components/auth/ProtectRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Notes from './pages/Notes';
import Register from './pages/Register';
import { useLoadUserQuery } from './redux/api/api';
import { userExists } from './redux/auth';

function App() {
  const { data: userData, isLoading, isError } = useLoadUserQuery();
  const dispatch = useDispatch();

  useEffect(() => {
    if (userData) {
      dispatch(userExists(userData.user));
    }
  }, [userData]);

  const { user, userLoading } = useSelector((state) => state.auth);

  return (
    <>
      {userLoading ? (
        <>Loading...</>
      ) : (
        <BrowserRouter>
          {user && <Navbar />}
          <Routes>
            <Route
              path="/login"
              element={user ? <Navigate to="/" replace /> : <Login />}
            />
            <Route
              path="/register"
              element={user ? <Navigate to="/" replace /> : <Register />}
            />
            <Route
              path="/"
              element={
                <ProtectRoute user={user}>
                  <Home />
                </ProtectRoute>
              }
            />
            <Route
              path="/notes"
              element={
                <ProtectRoute user={user}>
                  <Notes />
                </ProtectRoute>
              }
            />
          </Routes>
          <Toaster position="top-right" />
        </BrowserRouter>
      )}
    </>
  );
}

export default App;
