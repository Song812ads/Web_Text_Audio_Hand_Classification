from flask import Flask, send_file ,request, jsonify, Response, make_response
import jwt
from flask_cors import CORS, cross_origin
import torch
import librosa
import tensorflow as tf
from transformers import Wav2Vec2Model, Wav2Vec2FeatureExtractor, Wav2Vec2ForSequenceClassification, AutoTokenizer, BitsAndBytesConfig, AutoModelForSequenceClassification
import numpy as np 
from mqtt_client import MQTTClient
import json
from functools import wraps
from unidecode import unidecode
import re
import base64
from flask_socketio import SocketIO, emit
import io
app = Flask(__name__)
app.config['SECRET_KEY'] = 'nhungngay0em'
cors = CORS(app, origins='*', X_Content_Type_Options= 'nosniff')
client = MQTTClient('user_web')
path = 'D:/contiki/doan/web_AI/hand-gesture/model'
socketio = SocketIO(app, cors_allowed_origins="*")
COUNT = 15

label_predict = [
    'Tắt đèn phòng khách',
    'Mở đèn phòng khách',
    'Tắt đèn phòng ngủ', 
    'Mở đèn phòng ngủ',
    'Tắt đèn nhà bếp',
    'Mở đèn nhà bếp', 
    'Đo nhiệt độ phòng',
    'Mở quạt chạy chậm',
    'Mở quạt chạy vừa',
    'Mở quạt chạy nhanh',
    'Tắt quạt',
    'Đặt thông báo, thức giấc',
    'Mở cửa giúp tôi ',
    'Đóng cửa ',
    'Điều chỉnh máy giặt chế độ thông thường ',
    'Điều chỉnh giặt chế độ sợi bông ',
    'Điều chỉnh chế độ giặt chăn mền ',
    'Tắt máy giặt ',
    'Mở wifi ',
    'Tắt wifi ',
    'Mở máy nước nóng trong nhà tắm',
    'Tắt máy nước nóng trong nhà tắm ',
    'Tắt chế độ tưới cây ',
    'Bật chế độ tươi cây tự động ',
    'Tăng âm lượng loa phòng khách', 
    'Giảm âm lượng loa phòng khách ',
    'Tắt loa phòng khách ',
    'TH khác'
]

labelNames = [
    "Led 1&2&3 Off",
    "Led 1 On",
    "Led 2 On",
    "Led 3 On",
    "Led 1&2 On",
    "Led 1&3 On",
    "Led 2&3 On",
    "Led 1&2&3 On"
]

def clean_text(text):
    return re.sub(r'[^\w\s]', '', text).lower().strip()

label_predict_clean = [clean_text(label) for label in label_predict]

def check_word_in_label(text, labels):
    # Clean the input text
    clean_text_input = clean_text(text)
    
    # Split the cleaned input text into words
    words = clean_text_input.split()
    
    # Check if any word is in the cleaned label list
    for word in words:
        if any(word in label for label in labels):
            return True
    return False

class KeyPointClassifier(object):
    def __init__(
        self,
        model_path='static/tfjsv2/keypoint_classifier.tflite',
        num_threads=1,
    ):
        self.interpreter = tf.lite.Interpreter(model_path=model_path,
                                               num_threads=num_threads)

        self.interpreter.allocate_tensors()
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()

    def __call__(
        self,
        landmark_list,
    ):
        input_details_tensor_index = self.input_details[0]['index']
        self.interpreter.set_tensor(
            input_details_tensor_index,
            np.array([landmark_list], dtype=np.float32))
        self.interpreter.invoke()

        output_details_tensor_index = self.output_details[0]['index']

        result = self.interpreter.get_tensor(output_details_tensor_index)

        result_index = np.argmax(np.squeeze(result))

        return result_index
    
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # jwt is passed in the request header
        if 'Authorization' in request.headers:
            token = request.headers["Authorization"].split(" ")[1]
        # return 401 if token is not passed
        if not token:
            return jsonify({'message' : 'Token is missing !!'}), 401
        try:
            data = jwt.decode(token, app.secret_key, ["HS256"])
            auth = data.get('username')
            if auth!='song' and auth!='demo':
                print(auth)
                return jsonify({'message' : 'Invalid Token !!'}), 401
        except:
            return jsonify({
                'message' : 'Token is invalid !!'
            }), 401
        return  f(auth,*args, **kwargs)
    return decorated


@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('audio_data')
def handle_audio_data(data):
    try:
        audio_bytes = base64.b64decode(data)
        audio_file = io.BytesIO(audio_bytes)
        # audio, samplerate = sf.read(audio_file)
        # audio = np.array(audio).astype(np.float32)
        # ... Your audio processing logic here ...
        result_class = audio_model_3(audio_file) 
        if result_class==11:
            result_class = 27
        client.pub('/t1',unidecode(label_predict[int(result_class)]))   
        emit('prediction_result', json.dumps({"result_class": label_predict[int(result_class)]}))
        # result_class = "Audio Processed Successfully"
        # emit('prediction_result', json.dumps({"result_class": result_class}))
    except Exception as e:
        print(f"Error processing audio: {e}")
        emit('prediction_error', json.dumps({"error": str(e)}))

def wav_to_logmelspectrogram(file, sample_rate=16000, hop_length=1024, n_mels=64 ):

    # # Convert audio data to numpy array
    y, sr = librosa.load(file, sr=sample_rate, mono=True, duration=10)
    print(y.shape)
    
    # Ensure the audio data is long enough
    if len(y) < 2:
        raise ValueError("Audio data is too short.") # Change to your desired sample rate

    #     # Resample the audio data
    # if sr != desired_samplerate:
    #     y= librosa.resample(y, orig_sr=sr, target_sr=desired_samplerate)

    S_full, phase = librosa.magphase(librosa.stft(y))

    S_filter = librosa.decompose.nn_filter(S_full,
                                aggregate=np.median,
                                metric='cosine',
                                width = int(librosa.time_to_frames(0.5, sr=sr)))

# The output of the filter shouldn't be greater than the input
# if we assume signals are additive.  Taking the pointwise minimum
# with the input spectrum forces this.
    S_filter = np.minimum(S_full, S_filter)

    margin_i, margin_v = 2, 10
    power = 2

    mask_i = librosa.util.softmask(S_filter,
                                margin_i * (S_full - S_filter),
                                power=power)

    mask_v = librosa.util.softmask(S_full - S_filter,
                                margin_v * S_filter,
                                power=power)

    # Once we have the masks, simply multiply them with the input spectrum
    # to separate the components

    S_foreground = mask_v * S_full
    S_background = mask_i * S_full

    y = librosa.istft(S_foreground * phase)

    # y = librosa.util.normalize(y)

    target_length = 10 * sample_rate

    # If the audio is shorter than the target length, pad with zeros
    if len(y) < target_length:
        padding = target_length - len(y)
        y = np.pad(y, (0, padding), mode='constant')

    # Compute the log-mel spectrogram
    mfccs = librosa.feature.mfcc(y=y, sr=sample_rate, n_mfcc=24, hop_length = 1024, window = 'hann', n_fft = 2048)

    # log_S = librosa.power_to_db(S, ref=np.max)
    # # print(log_S)
    # # print(padded_log_S_with_cls)
    # normalize_log_S = librosa.util.normalize(mfccs.transpose())
    
    normalize_mfccs = librosa.util.normalize(mfccs.transpose())
    
    # Add positional encoding
    # pos_enc = positional_encoding_2d(normalize_mfccs.shape[0], normalize_mfccs.shape[1])
    # final_mfccs = normalize_mfccs 
    # final_log_S = log_S.transpose() + positional_encoding(normalize_log_S.shape[0], normalize_log_S.shape[1])

    return normalize_mfccs, sr

def preprocess_single_audio(file_path):
    y, sr = librosa.load(file_path, sr=16000, mono=True,duration=10)
    duration = librosa.get_duration(y=y, sr=sr)

    if len(y) < 10 * 16000:
        padding = 10 * 16000 - len(y)
        y = np.pad(y, (0, padding), mode='constant', constant_values=0)
    S_full, phase = librosa.magphase(librosa.stft(y))
    
    width = int(librosa.time_to_frames(2, sr=sr))
    # print(width)
    S_filter = librosa.decompose.nn_filter(S_full,
                                aggregate=np.median,
                                metric='cosine',
                                width=width)

    S_filter = np.minimum(S_full, S_filter)

    margin_i, margin_v = 2, 10
    power = 2

    mask_i = librosa.util.softmask(S_filter,
                                margin_i * (S_full - S_filter),
                                power=power)

    mask_v = librosa.util.softmask(S_full - S_filter,
                                margin_v * S_filter,
                                power=power)
    S_foreground = mask_v * S_full
    S_background = mask_i * S_full

    y = librosa.istft(S_foreground * phase)
    y = librosa.util.normalize(y)
    inputs = audio_feature_extractor(y, sampling_rate=16000, return_tensors="pt")
    return inputs.input_values.squeeze().unsqueeze(0)  # Add batch dimension

# Apply softmax to get probabilities

def audio_model_3(file):
    data = preprocess_single_audio(file)

    with torch.no_grad():
        outputs = audio_model(data)
        logits = outputs.logits

    # Apply softmax to get probabilities
    probabilities = torch.softmax(logits, dim=-1)
    predicted_class = probabilities.argmax(dim=-1).item()
    print(f"Predicted class: {predicted_class}")

    return predicted_class



def text_class(data):


    def tokenize_function(examples):
        # Tokenize and truncate text
        tokenized_inputs = text_tokenizer(
            examples,  # This should be a list of strings
            truncation=True,
            max_length=30,
            padding="max_length",
            return_tensors='pt'  # This ensures that the output is in tensor format
        )
        return tokenized_inputs
    # Tokenization function
    # Tokenize the input text
    clean_data = re.sub(r'[^\w\s]', '', data).lower().strip()
    data = tokenize_function(clean_data)
    mb_x = data['input_ids']
    mb_m = data['attention_mask']
    
    single_test_case = {
    'input_ids': mb_x,  # Pass a single input_ids sequence
    'attention_mask': mb_m,  # Corresponding attention mask
}
    # Predict for a single data point
    with torch.no_grad():
        outputs = text_model(**single_test_case)
        logits = outputs.logits  # Access the logits
        predictions = torch.argmax(logits, dim=-1)

    return predictions


@app.route('/predict', methods=['POST'])
def predict():
    global prev_pred, dem, send
    data = request.get_json()
    if data == 'reset':
        send= True
        return json.dumps(7, indent=2, default=int)
    data = data.get('data')
    data = np.reshape(data,(1,42))
    # print(data)
    pred = hand_model(data)
    if dem == COUNT and prev_pred == pred:
        prev_pred = pred
        if send:
            client.pub('/t1',str(pred))
        send = False
        return json.dumps(pred, indent=2, default=int)
    elif dem<COUNT and prev_pred == pred:
        send = True
        prev_pred = pred
        dem = dem +1 
        return jsonify('ok'),200
    elif prev_pred!=pred:
        send = True
        prev_pred = pred
        dem = 0
        return jsonify('ok'), 200
    else: 
        return jsonify("Something error"),500
#'D:/contiki/doan/web_AI/my-app/src/static/tfjsv2/group1-shard1of1.bin'

@app.route('/static/tfjsv2/model.json')
def serve_model():
    model_path = 'static/tfjsv2/model.json'
    return send_file(model_path, mimetype='application/json')

@app.route('/static/tfjsv2/group1-shard1of1.bin')
def serve_binary_weights():
    weights_path = 'static/tfjsv2/group1-shard1of1.bin'
    return send_file(weights_path, mimetype='application/octet-stream')

@app.route('/log', methods = ['POST'])
def login():
    if request.method == "POST":
        data = jwt.decode(request.json,app.secret_key,["HS256"])
        username = data['username']
        password = data['password']
        if (username == None or password == None):
            print('here')
            return make_response(
                'Authorize fail',403,{'WWW-Authenticate' : 'Basic realm = "Login required" !!'}
            )
        if (username == 'demo' and password == 'demo') or (username == 'song' and password == 'song'):
            token = jwt.encode({
                'username': username
            },
            app.config['SECRET_KEY']
            ) 
            return make_response(jsonify({'token': token}),200)
        else:
            return make_response(
                'Authorize fail',403,{'WWW-Authenticate' : 'Basic realm = "Login required" !!'}
            )
        
    return make_response(
        'Could not verify',
        403,
        {'WWW-Authenticate' : 'Basic realm ="Wrong Password !!"'}
    )

@app.route('/check_user',methods=['GET'])
@token_required
def checkUser(auth):
    if auth:
        return jsonify({'user':auth}),200
    else:
        return jsonify('False'),401
    

@app.route('/data', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    uploaded_file = request.files['file']
    if uploaded_file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    try:
        result_class = audio_model_3(uploaded_file) 
        if result_class==11:
            result_class = 27
        client.pub('/t1',unidecode(label_predict[int(result_class)]))   
        return jsonify({"message": "File uploaded successfully!", "result_class": label_predict[int(result_class)]}), 200

    except Exception as e:
        print(f"Error processing file: {e}")  # Log the error
        return jsonify({"error": str(e)}), 500


@app.route('/text_predict', methods = ['POST'])
def predict_text():
    data = request.get_json()
    data_store = data.get('data')
    checkin = check_word_in_label(data_store, label_predict_clean)
    if not checkin:
        return jsonify({"message": "File uploaded successfully!", "result_class": label_predict[int(len(label_predict)-1)]}),200
    
    try:   
        result_class = text_class(data_store)
        if result_class != len(label_predict)-1:
            client.pub('/t1',unidecode(label_predict[int(result_class)]))
        return jsonify({"message": "File uploaded successfully!", "result_class": label_predict[int(result_class)]}), 200
    except Exception as e:
        print(f"Error processing file: {e}")  # Log the error
        return jsonify({"error": str(e)}), 500


@app.route('/load_model')
def load_model():
    if(text_tokenizer==None or text_model==None or audio_feature_extractor == None or audio_model == None):
        return jsonify('False'),400
    else:
        return jsonify('True'), 200
    
if __name__ == '__main__':

    hand_model = KeyPointClassifier()
    prev_pred = 8
    dem = 0
    send = True
    # bnb_config = BitsAndBytesConfig(
    # load_in_4bit=True,
    # bnb_4bit_use_double_quant=True,
    # bnb_4bit_quant_type="nf4",
    # bnb_4bit_compute_dtype=torch.bfloat16
    # )
    # config = AutoConfig.from_pretrained("meta-llama/Llama-2-7b-hf", use_remote_code = True )
    # config.init_device = 'cuda'

    text_model = AutoModelForSequenceClassification.from_pretrained(
        "static/text/model_bert",
        # device_map="auto",
        local_files_only=True,
        # quantization_config = bnb_config,
        num_labels = 28,
        # config = config
    )
    
    text_tokenizer = AutoTokenizer.from_pretrained("static/text/model_bert/", local_files_only=True )
    if text_tokenizer.pad_token is None:
        text_tokenizer.pad_token = text_tokenizer.eos_token if text_tokenizer.eos_token else "[PAD]"
    # model = get_peft_model(model, config)
    text_model.config.pad_token_id = text_model.config.eos_token_id
    text_model.eval()

    model_name = "static/audio_model_finetune"
    audio_feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(model_name)
    audio_model = Wav2Vec2ForSequenceClassification.from_pretrained('static/audio_model_finetune',
                                                              num_labels = 12,
                                            
    local_files_only=True)
    audio_model.eval()

    # from gunicorn.main import run
    socketio.run(app, host='0.0.0.0', port=8000,allow_unsafe_werkzeug=True)
