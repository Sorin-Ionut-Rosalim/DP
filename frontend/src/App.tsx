import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Scan from './pages/Scan';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';
import NotFound from './pages/NotFound';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route path="/home" element={ <PrivateRoute> <Home /> </PrivateRoute> }/>
        <Route path="/profile" element={ <PrivateRoute> <Profile />  </PrivateRoute> } />
        <Route path="/scan" element={ <PrivateRoute> <Scan /> </PrivateRoute> } />

        {/* 404 handling */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;