// Example using Routes in React Router v6
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Lists from './Lists';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Lists />} />
      </Routes>
    </Router>
  );
}

export default App;
