import React, { useState, useEffect, useRef } from 'react';

// import Worker from "./worker.js";
const TextComponent = () => {
  const [predict, setPredict] = useState('');
  const [loading, setLoading] = useState(null);
  const [text, setText] = useState('');
  const [fps, setFps] = useState('')
  // Spinner Component
  const Spinner = () => (
    <div className="spinner-border spinner-border-sm text-light" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  );

  // Adjust textarea height automatically
  const adjustTextareaHeight = (event) => {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  const host = 'http://localhost:8000';

  // Handle change event for textarea
  const handleChange = (e) => {
    setText(e.target.value);
  };

  // Send Request
  const sendRequest = async (e) => {
    e.preventDefault();

      const payload = { data: text };
      let prev_time = performance.now()
      try {
        setLoading(true);
        
        const response = await fetch(`${host}/text_predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Credentials': true,
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const responseData = await response.json();
        setPredict(responseData.result_class);
        setLoading(false);
      } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
      
    }
    let current_time = performance.now()
    setFps((1000/(current_time-prev_time)).toFixed(2))
  };

  // Handle model selection


  return (
    <div className="container mt-5">

<div className="card-body">
          <div className="row mb-3">
            {/* Label for the input */}
            <div className="col-auto">
              <label htmlFor="inputText" className="col-form-label text-white">
                Input:
              </label>
            </div>

            {/* Textarea */}
            <div className="col">
              <div className="input-group ">
                <textarea
                  className="form-control"
                  id="inputText"
                  placeholder="Type your message..."
                  value={text}
                  onChange={(e) => {
                    handleChange(e);
                    adjustTextareaHeight(e);
                  }}
                  rows="1"
                  style={{ overflow: 'hidden', resize: 'none' }}
                />
                <button className="btn btn-info" type="button" onClick={sendRequest}>
                  Predict
                </button>
              </div>
            </div>
          </div>
              
          <hr style={{ border: '1px solid white' }}/>
          
          <div className="text-start pt-3">
            <p className="text-white">Prediction: {loading ? <Spinner /> : predict}</p>
            <p className="text-white">Generated token/s: {loading ? <Spinner /> : fps}</p>
          </div>
        </div>
      </div>
    
  );
};

export default TextComponent;
