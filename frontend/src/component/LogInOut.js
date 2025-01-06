import React from 'react'
import { useEffect } from 'react'
import { Sidebar, Menu, MenuItem, useProSidebar } from "react-pro-sidebar";
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const LogInOut = () => {
    const navigate = useNavigate()
    const [sta,setSta] = useState(true)
    const host = 'http://localhost:8000'
    const handleLoginClick = () => {
        navigate("/login");
      };     

     const handleLogoutClick = async () =>{
        sessionStorage.removeItem('token')
        // window.location.href= host + '/logout'
        window.location.reload()
     } 

    let state = true
    const url = host + '/check_user'
    const getUSer = async () =>{
        const request = {
            method: 'GET',
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin' : 'origin',
                'Access-Control-Allow-Headers':'Content-Type, Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Credentials' : true,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        }
        }
              await fetch(url,request)
            //   .then((response)=>response.json())
              .then((response)=>{
                if (!response.ok){
                    setSta(true)
                }
                else {
                    return (
                        setSta(false)
                      )
                }
              })
              .catch((e)=>{
                console.log(e)
              })
    }

    useEffect(()=>{
        if (state){
            getUSer()
            state = false
        }
    },[])
    if (sta){
    return (
        <MenuItem icon={<ReceiptOutlinedIcon /> } onClick={handleLoginClick}>LogIn</MenuItem>
      )
    }
    else {
        return (
        <MenuItem icon={<ReceiptOutlinedIcon /> } onClick={handleLogoutClick}>LogOut</MenuItem>
        )
    }
}

export default LogInOut