
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import "./App.css";
import '@tensorflow/tfjs-backend-cpu';
import Header from "./component/Header";
import { Sidebar, Menu, MenuItem, useProSidebar } from "react-pro-sidebar";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import LogInOut from "./component/LogInOut";
import VideocamIcon from '@mui/icons-material/Videocam';
import CoPresentIcon from '@mui/icons-material/CoPresent';
import SettingsVoiceIcon from '@mui/icons-material/SettingsVoice';
import DashboardIcon from '@mui/icons-material/Dashboard';
const Login = () => {

  const { collapseSidebar } = useProSidebar();
  const host = "http://localhost:8000"
let check = true


  const navigate = useNavigate()
  const sign = require('jwt-encode')
  const secret = 'nhungngay0em'
  const [pass,setPass] =  useState('')
  const [user,setUser] = useState('')
  const jwtEnocde = async () =>{
    const data = {
      'username' : user,
      'password' : pass
    }
    let modifiedPassword = sign(data, secret)
    const request = {
      method: 'POST',
      statusCode: 200,
      headers: {
          'Access-Control-Allow-Origin' : 'origin',
          'Access-Control-Allow-Headers':'Content-Type, Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Credentials' : true,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer ' + auth.user.access_token
  },
  body: JSON.stringify(modifiedPassword)
}
    const response = await fetch(host+'/log', request)
                          .then((response)=>{if (!response.ok){
                            setPass('')
                            setUser('')
                            alert('Login fail. Try again')
                          }
                          else {
                          return response.json()
                          }
                          })
                          .then((response)=>{
                            if (response.token){
                              alert("Login success")
                              navigate('/')
                              sessionStorage.setItem('token',response.token)
                            }
                    
                          })
                          .catch(e => {
                            console.log(e)
                          })
                        }

  return (
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
  <div className="container py-5 h-100">
    <div className="row d-flex justify-content-center align-items-center h-100">
      <div className="col-12 col-md-8 col-lg-6 col-xl-5">
        <div className="card bg-dark text-white" >
          <div className="card-body p-5 text-center">
            <div className="mb-md-5 mt-md-4 pb-1">
              <h2 className="fw-bold mb-2 text-uppercase">Login</h2>
              <p className="text-white-50 mb-5">Please enter your login and password!</p>
              <div className="form-outline form-white mb-4">
                <input className="form-control form-control-lg" placeholder='Username' value={user} onChange={(e)=>setUser(e.target.value)}/>
              </div>
              <div className="form-outline form-white mb-4">
                <input className="form-control form-control-lg" type="password" placeholder='Password' value={pass} onChange={(e)=>setPass(e.target.value)}/>
              </div>
              {/* <p class="small mb-5 pb-lg-2"><a class="text-white-50" href="#!">Forgot password?</a></p> */}
              <button className="btn btn-outline-light btn-lg px-5" type="submit" onClick={()=>jwtEnocde()}>Login</button>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
   </div>
   <Header />
 </div>
  );


}

export default Login