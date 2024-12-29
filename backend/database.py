from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import select, create_engine, extract, and_
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, date
import numpy as np
import time
import pytz

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://admin:admin@localhost:4321/adminData'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
engine = create_engine('postgresql://admin:admin@localhost:4321/adminData', echo=True)
Base = declarative_base()
Base.metadata.create_all(engine)

class Device(db.Model):
    __tablename__ = "device"
    id = db.Column('id',db.Integer, primary_key=True)
    device_IP = db.Column('device_IP',db.String(64),  nullable=False)
    def __repr__(self):
        return '<Post: {}>'.format(self.id)
    

class Sensor(db.Model):
    __tablename__ = "sensor"
    id = db.Column('id',db.Integer, primary_key=True)
    sensor_type = db.Column('sensor_type',db.String(64), nullable = False)
    def __repr__(self):
        return '<Post: {}>'.format(self.id)

class Data(db.Model):
    __tablename__ = "data"
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column('device_id',db.Integer, db.ForeignKey('device.id'), unique=False)
    sensor_id = db.Column('sensor_id', db.Integer, db.ForeignKey('sensor.id'), unique = False)
    device = db.relationship("Device", backref = "deviceRef", foreign_keys = [device_id])
    sensor = db.relationship("Sensor", backref = "sensorRef", foreign_keys = [sensor_id])
    day = db.Column('day',db.Date, default=datetime.now().date())
    time = db.Column('time', db.Time, default = datetime.now().strftime("%H:%M:%S"))
    value = db.Column('value',db.Float)
    def __repr__(self):
        return '<Post: {}>'.format(self.id)

class CRUD_DB():
    def __init__(self, device_IP, sensor_type):
        self.device_IP = device_IP
        self.sensor_type = sensor_type
        self.device = Device.query.filter_by(device_IP = device_IP).first()
        self.sensor = Sensor.query.filter_by(sensor_type = sensor_type).first()
        if self.device == None:
            self.device = Device(device_IP = device_IP)
        if self.sensor == None:
            self.sensor = Sensor(sensor_type = sensor_type)

    def add(self,date,value):
        data = Data(device = self.device, sensor = self.sensor, time = date, value = value)
        db.session.add(data)
        db.session.commit()

    def clean_all(self):
        db.session.query(Data).delete()
        db.session.query(Device).delete()
        db.session.query(Sensor).delete()
        db.session.commit()
    
    def get_data_with_date(self,date):
        data = select(Data.value, Data.time).where(
                                                    and_(
                                                    Data.device_id==self.device.id,
                                                    Data.sensor_id==self.sensor.id,
                                                    # extract('hour',Data.time) == hour,
                                                    extract('year', Data.day) == date.year,
                                                    extract('month', Data.day) == date.month,
                                                    extract('day', Data.day) == date.day,
                                                    ))
        with engine.connect() as conn:
            timeResponse = []
            dataResponse = []
            results = conn.execute(data)
            for result in results:
                timeResponse.append(result.time)
                dataResponse.append(result.value)
            return np.array(timeResponse), np.array(dataResponse)
    
    def get_current_data(self):
        data = select(Data.value).where(Data.device_id == self.device.id,
                                        Data.sensor_id == self.sensor.id,
                                        ).order_by(Data.time)
        with engine.connect() as conn:
            result = conn.execute(data).fetchone()
            return result
    
    def add_data(self):
        # Iterate over the hours from 0 to 11
        for hour in range(12):
            # Calculate the datetime for the current hour
            current_datetime = datetime.now().replace(hour=hour, minute=0, second=0, microsecond=0)
            
            # Create a new Data instance with the calculated datetime and other required values
            data_entry = Data(
                device = self.device,  # Replace with the appropriate device ID
                sensor = self.sensor,  # Replace with the appropriate sensor ID
                day=current_datetime.date(),
                time=current_datetime.time(),
                value=np.random.randint(30)  # Set the value as needed
            )

            # Add the data entry to the database session
            db.session.add(data_entry)

        # Commit all data entries to the database
        db.session.commit()

if __name__=='__main__':
    with app.app_context():
        # db.session.commit()
        
        db.create_all()
        data = CRUD_DB('123', 'Device 2')
        time_sensor = data.get_data_with_date(datetime.strptime('11/04/2024', '%d/%m/%Y'))[0]
        data_sensor = data.get_data_with_date(datetime.strptime('11/04/2024', '%d/%m/%Y'))[1]
        time_sensei = [t.strftime('%H:%M') for t in time_sensor]
        # print(datetime.now().date())
        print(time_sensei)
        print(data_sensor)
        db.session.close()