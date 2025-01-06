import Image from 'react-bootstrap/Image';
import React, { Component }  from 'react';
import '../'
import './header.css'
const Header = () => {
  return (
    // <div className="d-flex justify-content-between p-2 shadow-lg shadow-blue-500/50 align-items-center">
<div className="header d-flex justify-content-center align-items-center" style={{backgroundColor:'#ffc700'}}>
  <img
    // className="img-thumbnail"
    src={require('../static/img/logoBK.png')}
    alt="logo"
    className="me-5"
  />
  <h3 className="ms-5 vietnamese-font fw-bold" >Luận văn tốt nghiệp</h3>
</div>

  );
};

export default Header