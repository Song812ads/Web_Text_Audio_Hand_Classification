import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ReactMic } from 'react-mic';
import io from 'socket.io-client';

const ReactRecorder = () => {
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingtime, setisLoadingtime] =useState(false)
    const [voice, setVoice] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [recordBlobLink, setRecordBlobLink] = useState(null);
    const [predict, setPredict] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);
    const [timeData, setTime] = useState('')
    const [fps,setFps] = useState(false)
    const [start_time,setStart_time] = useState(0)
    const [socket, setSocket] = useState(null);
    const [start_inf_time,setStart] = useState(0)
    const [stop_inf_time,setStop] = useState(0)
    // let stop_inf_time = 0
    useEffect(() => {
        // Establish Socket.IO connection
        const newSocket = io('http://127.0.0.1:8000', { transports: ['websocket'] }); // Replace with your Flask server URL
    
        setSocket(newSocket);
    
        newSocket.on('connect', () => {
          console.log('Connected to Socket.IO server!');
        });
    
        newSocket.on('disconnect', () => {
          console.log('Disconnected from Socket.IO server!');
        });
    
        newSocket.on('prediction_result', (data) => {
          try {
            const parsedData = JSON.parse(data);
            setPredict(parsedData.result_class);
            let stop_inf_time = performance.now()
            console.log(stop_inf_time)
            setStop(stop_inf_time)
            setIsLoading(false)
            setFps(true)
          } catch (error) {
            console.error("Error parsing prediction:", error, data);
            setErrorMessage("Error processing server response.");
          }
        });
        
        newSocket.on('prediction_error', (data) => {
          try {
            const parsedData = JSON.parse(data);
            setErrorMessage(parsedData.error);
          } catch (error) {
            console.error("Error parsing prediction error:", error, data);
            setErrorMessage("Error processing server response.");
          }
        });
    
        return () => {
          newSocket.disconnect();
        };
      }, []);

    const Spinner = () => (
        <div className="spinner-border spinner-border-sm text-light" role="status">
            <span className="visually-hidden">Loading...</span>
        </div>
    );

    // let start_inf_time = 0 
    const sendBlob = (audioBlob) => {
        setIsLoading(true)
        // setStart(performance.now())
        
        if (socket && socket.connected) {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result instanceof ArrayBuffer) {
              const base64Audio = btoa(String.fromCharCode(...new Uint8Array(reader.result)));
              socket.emit('audio_data', base64Audio);
            } else {
              console.error("FileReader result is not an ArrayBuffer");
              setErrorMessage("Error reading audio data.");
            }
          };
          reader.readAsArrayBuffer(audioBlob);
        } else {
    
          console.error("Socket not connected!");
          setErrorMessage("Not connected to server. Please try again later.");
        }
        
        
      };

    const onStop = (recordedBlob) => {
        setRecordBlobLink(recordedBlob.blobURL);
        setIsRunning(false);
        
    };
    // let start_time = 0
    const startHandle = async () => {
        
        setStart_time(performance.now())
        
        // console.log(start_time)
       
        // start_time = performance.now()
        setAudioUrl(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                
                audioChunksRef.current.push(event.data)};
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
                setStart(performance.now())
                console.log(start_inf_time)
                
                await sendBlob(audioBlob);
                audioChunksRef.current = [];
            };
            
            mediaRecorderRef.current.start();
            setIsRunning(true);
            setVoice(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access the microphone. Please check your permissions.');
        }
    };

    const stopHandle = () => {
        mediaRecorderRef.current.stop();
        setIsRunning(false);
        setVoice(false);
        setisLoadingtime(true)
        let stop_time = performance.now()
        setTime(((stop_time-start_time)/1000).toFixed(2).toString()+ ' s')
        setisLoadingtime(false)
        
    };

    const clearHandle = () => {
        setRecordBlobLink(null);
        setAudioUrl(null);
        setIsRunning(false);
        setVoice(false);
        setPredict('');
        setFps(false)
        setTime('')
        setErrorMessage(null);
        
    };

    return (
        <div>
            <ReactMic
                record={voice}
                className="sound-wave"
                onStop={onStop}
                strokeColor="#000000"
                backgroundColor="#FF4081"
                sampleRate={44100}
            />

            <div>
                {recordBlobLink && (
                    <button onClick={clearHandle} className="text-[#fff] font-medium text-[16px]">
                        Reset
                    </button>
                )}
            </div>

            <div className="mt-2">
                {!recordBlobLink && (
                    !voice ? (
                        <button
                            onClick={startHandle}
                            className="bg-[#fff] text-[#111] rounded-md py-1 px-3 font-semibold text-[16px]"
                            disabled={isRunning}
                        >
                            Start
                        </button>
                    ) : (
                        <button
                            onClick={stopHandle}
                            className="bg-[#fff] text-[#111] rounded-md py-1 px-3 font-semibold text-[16px]"
                        >
                            Stop
                        </button>
                    )
                )}
            </div>

            <div>
                {recordBlobLink && <audio controls src={recordBlobLink} className="mt-6 w-full" />}
            </div>

            <hr style={{ border: '1px solid white' }} />

            <div className="text-white text-start mx-5 p-3">
                {errorMessage && <p className="text-red-500">{errorMessage}</p>}
                <p className="text-white">Audio time: {isLoadingtime ? <Spinner /> : timeData}</p>
                 <p className="text-white">Prediction: {isLoading ? <Spinner /> : predict}</p>
                 <p className="text-white">Generated token/s: {isLoading ? <Spinner />:fps? (1000/(stop_inf_time-start_inf_time)).toFixed(2):''}</p>
            </div>

            {/* Uncomment if you want model selection */}
            {/* <div className="mx-5 p-3 text-start">
                <label htmlFor="modelSelect" className="text-white">Choose Model:</label>
                <select id="modelSelect" value={selectedModel} onChange={handleModelChange}>
                    <option value="Model 1">Model 1</option>
                    <option value="Model 2">Model 2</option>
                    <option value="Model 3">Model 3</option>
                </select>
            </div> */}
        </div>
    );
};

export default ReactRecorder;
