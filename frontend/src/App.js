import logo from './logo.svg';
import './App.css';
import Home from './components/Home';
import Navbar from './components/Navbar';
import Searchresult from './components/Searchresult';
import Paper from './components/Paper';
import {
  BrowserRouter as Router,
  Route,
  Routes
} from 'react-router-dom';
function App() {
  // const query=localStorage.getItem('query')
  return (
    <>
    <Router>
      <Navbar/>
      <div>
        <Routes>
          <Route exact path="/" element={<Home/>}></Route>
          <Route exact path="/searchresults/:query" element={<Searchresult/>}></Route>
          <Route eaxct path="/paper/:query" element={<Paper/>}></Route>
        </Routes>
      </div>
    </Router>
    </>
  );
}

export default App;
