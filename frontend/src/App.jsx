import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Prediction from './pages/Prediction';
import Visualization from './pages/Visualization';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="prediction" element={<Prediction />} />
          <Route path="visualization" element={<Visualization />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
