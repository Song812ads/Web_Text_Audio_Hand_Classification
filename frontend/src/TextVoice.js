import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import '@tensorflow/tfjs-backend-cpu';
import Header from "./component/Header";
import { Sidebar, Menu, MenuItem, useProSidebar } from "react-pro-sidebar";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import VideocamIcon from '@mui/icons-material/Videocam';
import CoPresentIcon from '@mui/icons-material/CoPresent';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import DefaultPage from "./component/DefaultPage";
import SettingsVoiceIcon from '@mui/icons-material/SettingsVoice';
import Recorder from './component/Recorder'
import TextComponent from "./component/TextComponent";
import LogInOut from "./component/LogInOut";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { collapseSidebar } = useProSidebar();
  const host = "http://127.0.0.1:8000"
  const [page,setPage] = useState('home')
  const [modelType, setModelType] = useState('Choose model');
  const [state,setState] = useState('text')
let check = true

const [isLoading, setIsLoading] = useState(false);
const reloadPage = () => {
  window.location.reload();
};
const fetchData = async (retries = 5, delay = 1000) => {
  setIsLoading(true);
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(host+'/load_model'); // Replace with your backend endpoint
      if (response.status === 200) {
        // const result = await response.json();
        setIsLoading(false);
        return; // Exit if successful
      } else {
        console.warn(`Attempt ${i + 1} failed with status: ${response.status}`);
        // if (i==retries-1){
        //   reloadPage()
        // }
      }
    } catch (error) {
      console.error(`Attempt ${i + 1} failed with error:`, error);
    }
    // Wait before the next attempt
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  reloadPage()
  // setIsLoading(false); // Set loading to false if max retries reached
};


useEffect(()=>{
  // if (check){
  //   if (location.state)
  //   {
  //     setPage(location.state)
  //   }
  //   check = false
  // }
  // else {

    // fetchData();
  // }

},[])



const adjustTextareaHeight = (event) => {
  const textarea = event.target;
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
};

  
    const handleRadioChange = (event) => {
      setState(event.target.value); // Update state with the selected radio button value
    };

    const renderComponent = () => {
      if (state === 'text') {
        return <TextComponent />;
      } else {
        return <Recorder />;
      }
    };

    
  return (
    <div>
    {isLoading ? (
      <div>Server is loading model. Please wait...</div> // Loading indicator while data is fetched
    ) : (
      <div className="App bg-image" 
style={{
  backgroundSize: "cover",
  backgroundImage: `url("https://images.pexels.com/photos/753267/pexels-photo-753267.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2")`}}>
  <Header />
  <div style={{  height: "calc(100vh - 20px)", display: "flex" }}>
     <Sidebar style={{backgroundImage: `url("https://images.pexels.com/photos/1279813/pexels-photo-1279813.jpeg?auto=compress&cs=tinysrgb&w=600")`}} > 
       <Menu>
         <MenuItem
          icon={<MenuOutlinedIcon />}
          onClick={() => {
            collapseSidebar();
          }}
          style={{ textAlign: "center" }}
        >
          <h2>Admin</h2>
        </MenuItem>
        <MenuItem icon={<HomeOutlinedIcon />} onClick={()=>navigate('..',{state:'home'})}>Home</MenuItem>
        <MenuItem icon={<CoPresentIcon />} onClick={()=>navigate('..',{state:'present'})}>Presentation</MenuItem>
        <MenuItem icon={<VideocamIcon />} onClick={()=>navigate("/admin")}>Webcam Demo</MenuItem>
        <MenuItem icon={<SettingsVoiceIcon />} onClick={()=>navigate("/voice_text")}>Voice Text Demo</MenuItem>
        {/* <MenuItem icon={<DashboardIcon />} onClick={()=>navigate("/dashboard")}>Dashboard</MenuItem> */}
        {/* <MenuItem icon={<ReceiptOutlinedIcon /> } onClick={handleLoginClick}>LogIn</MenuItem> */}
        <LogInOut />
      </Menu>
    </Sidebar>
    <div style={{ flex: 1 }}>
      <div className="audio-recorder-container py-5 h-100 d-flex justify-content-center align-items-center">
          <div className="max-w-sm border py-4 px-6 bg-dark shadow-lg" style={{ width: '50vw' }}>
              <h2 className="text-white text-center mb-4">{state == 'text'? 'Text Classifier':'Audio Classifier'}</h2>
              <div className="form-check form-check-inline mb-3">
              <input
              className="form-check-input"
              type="radio"
              name="inlineRadioOptions"
              id="inlineRadio1"
              value="text"
              checked={state === 'text'}
              onChange={handleRadioChange}
            />
            <label className="form-check-label text-white" htmlFor="inlineRadio1">
              Text
            </label>
              </div>
              <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="inlineRadioOptions"
              id="inlineRadio2"
              value="audio"
              checked={state === 'audio'}
              onChange={handleRadioChange}
            />
            <label className="form-check-label text-white" htmlFor="inlineRadio2">
              Voice
            </label>
          </div>  
              {/* <Recorder /> */}
            {renderComponent()}

        {/* <div className="d-flex flex-column p-3">
        <div className="input-group">
          <button className="btn btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">{modelType}</button>
          <ul className="dropdown-menu">
            <li><a className="dropdown-item" href="#">Model 1</a></li>
            <li><a className="dropdown-item" href="#">Model 2</a></li>
            <li><a className="dropdown-item" href="#">Model 3</a></li>
            <li><hr className="dropdown-divider" /></li>
            <li><a className="dropdown-item" href="#">Reset</a></li>
          </ul>
          <textarea
            className="form-control"
            aria-label="Text input with dropdown button"
            placeholder="Type your message..."
            onInput={adjustTextareaHeight}
            rows="1"
            style={{ overflow: 'hidden', resize: 'none' }}
          />
          <button className="btn btn-outline-light" type="button" id="button-addon2">Predict</button>
        </div>
      </div>
      <p className='text-white text-start mx-3'>Hiihi</p> */}
        </div>
    </div>
</div>
   </div>
   <Header />
 </div>
    )}
  </div>

  );
}

export default App;
