import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VoiceRecorderUI from './components/VoiceRecorderUI';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<VoiceRecorderUI />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;