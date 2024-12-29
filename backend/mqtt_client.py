import paho.mqtt.client as mqtt #import the client1
import time
from queue import Queue
import uuid
import logging
FIRST_RECONNECT_DELAY = 1
RECONNECT_RATE = 2
MAX_RECONNECT_COUNT = 12
MAX_RECONNECT_DELAY = 60

# def on_connect(client, userdata, flags, rc):
#     if rc==0:
#         # print("connected OK Returned code=",rc)
#     else:
#         # print("Bad connection Returned code=",rc)

# def on_message(client, userdata, message):
#     q.queue(message)
#     print("message received " ,str(message.payload.decode("utf-8")))
#     print("message topic=",message.topic)
#     print("message qos=",message.qos)
#     print("message retain flag=",message.retain)

def on_log(client, userdata, level, buf):
    print("log: ",buf)

def on_publish(client,userdata,result):             #create function for callback
    print("data published \n")

def on_disconnect(client, userdata, rc):
    logging.info("Disconnected with result code: %s", rc)
    reconnect_count, reconnect_delay = 0, FIRST_RECONNECT_DELAY
    while reconnect_count < MAX_RECONNECT_COUNT:
        logging.info("Reconnecting in %d seconds...", reconnect_delay)
        time.sleep(reconnect_delay)

        try:
            client.reconnect()
            logging.info("Reconnected successfully!")
            return
        except Exception as err:
            logging.error("%s. Reconnect failed. Retrying...", err)

        reconnect_delay *= RECONNECT_RATE
        reconnect_delay = min(reconnect_delay, MAX_RECONNECT_DELAY)
        reconnect_count += 1
    logging.info("Reconnect failed after %s attempts. Exiting...", reconnect_count)

def wait_for(client,msgType,period=0.25):
    if msgType=="SUBACK":
        if client.on_subscribe:
            while not client.suback_flag:
                client.loop()  #check for messages
                time.sleep(period)

def init_clients(cname):
    # client= mqtt.Client(cname,False) #don't use clean session
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, cname, False)
    # client.tls_set(tls_version=mqtt.ssl.PROTOCOL_TLS)
    # client.username_pw_set(username="song123",password="Gnos91105712")
    client.username_pw_set(username="song", password="song")
    client.on_log=on_log
    # client.on_connect= on_connect        #attach function to callback
    client.on_publish = on_publish
    client.on_disconnect = on_disconnect
	#flags set
    client.topic_ack=[]
    client.run_flag=False
    client.running_loop=False
    client.subscribe_flag=False
    client.bad_connection_flag=False
    client.connected_flag=False
    client.disconnect_flag=False
    return client


class MQTTClient(mqtt.Client):
    def __init__(self, cname, queue = Queue()):
        self.client = init_clients(cname)
        broker_address = 'localhost'
        port = 6886
        try:
            self.client.connect(broker_address, port) #connect to broker
        except:
            print("Connect fail")
        self.messages_received = queue
        self.client.on_message = self.on_message
        self.client.loop_start()

    def on_message(self,client, userdata, message):
        mess = str(message.payload.decode("utf-8"))
        self.messages_received.put(mess)

    def sub(self, topic):
        self.client.subscribe(topic,1)
        wait_for(self.client,"SUBACK")
        while not self.messages_received.empty():
            time.sleep(0.1)
    
    def pub(self,topic,mess):
        self.client.publish(topic,mess,0)
        # self.client.loop_stop()
    
    def dis(self):
        if self.client.is_connected():
            self.client.disconnect()

    def __del__(self):
        self.client.disconnect()


if __name__ == "__main__":
    client = MQTTClient('user3')
    client.pub('test','Giảm âm lượng loa phòng khách ')
    client.sub('test')
    # print('user', uuid.uuid4())

    while True:
        time.sleep(1)
    client.dis()