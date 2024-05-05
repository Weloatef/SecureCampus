// import React, {useState,useEffect} from 'react'
import Header from './components/Header';
import CameraFeed from './components/CameraFeed';
import Results from './components/Results';
import './App.css';

function App() {
    // const [data, setData] = useState([{}])
    // useEffect(() => {
    //     fetch('/members')
    //         .then((res) => res.json())
    //         .then((data) => setData(data))
    // }, [])
  return (
    <div >
      <Header />
      <CameraFeed />
      <Results />
        {/* {
            (typeof data.members === 'undefined') ? <p>loading...</p> : (data.members.map(
                (member, i) => ( <p key={i}>{member}</p>))
        )} */}
    </div>
  )
}

export default App