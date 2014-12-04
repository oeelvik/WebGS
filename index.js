var port = 8080;

var serialPort = require("serialport"),
	SerialPort = serialPort.SerialPort,
	express = require("express"),
	app = express(),
	server = require("http").createServer(app),
	io = require("socket.io").listen(server);


server.listen(port);
console.log("Listening for clients on port 8080");

app.use(express.static(__dirname + "/public"));

app.get("/", function(req, res){
	res.redirect("index.html");
});

var serial = null;



io.sockets.on("connection", function(socket){

	var listSerialPorts = function(){
		serialPort.list(function (err, ports) {
			console.log("Avilable ports:");
			console.log(ports);
			socket.emit("serialPorts", []);//ports);
		});
	}

	listSerialPorts();

	var serialConnect = function(portName, baudRate){
		serial = new SerialPort(portName, {
			parser: byteStreamParser(),
			baudRate: baudRate
		}, true, serialConnected);

		serial.on('data', function (data) {

			var type = data[0];
			switch (type) {
				case 0:
					socket.emit('message', 'log', String(data.slice(1)));
					break;
				case 1:
					socket.emit('message', 'info', String(data.slice(1)));
					break;
				case 2:
					socket.emit('message', 'warn', String(data.slice(1)));
					break;
				case 3:
					socket.emit('message', 'error', String(data.slice(1)));
					break;
				case 10:
					socket.emit('config', config2JSON(data.slice(1)));
					break;
				case 100: //DATA
					socket.emit('data', streamMessageToJSON(data.slice(1)));
					break;
				default:
					socket.emit('message', 'error', 'Unknown message type received from drone: ' + type);
			}
		});
	}

	socket.on('serialConnect', function(portName, baudRate){
		console.log("Opening serial port: " + portName);

		if(serial != null) {
			serial.close(function(error){
				//serialDisconnected(error)
				serialConnect(portName, baudRate);
			});
		} else {
			serialConnect(portName, baudRate);
		}
		
	});

	socket.on('serialDisconnect', function(){
		console.log("Closing serial connection");

		if(serial != null) {
			serial.close(serialDisconnected);
			serial = null;
		}
	});

	var serialConnected = function(error){
		if ( error ) {
			console.log('failed to open: '+error);
			socket.emit("message", "error", 'failed to open: '+error);
			serial = null;
		} else {
			socket.emit("serialConnected");
			requestCurrentConfig();
		}
	}

	var serialDisconnected = function(error){
		if ( error ) {
			console.log('failed to close: '+error);
			socket.emit("message", "error", 'failed to close: '+error);
		} else {
			socket.emit("serialDisconnected");
			serial = null;
		}
	}

	var requestCurrentConfig = function(){
		//TODO: get config from copter if avilable
		var config = { "imu": { "gyro": { "roll": { "pin": 1, "rev": false }, "nick": { "pin": 2, "rev": false }, "yaw": { "rev": false, "pin": 3 } }, "accelerometer": { "roll": { "pin": 4, "rev": true }, "nick": { "rev": true, "pin": 5 }, "yaw": { "rev": true, "pin": 6 } } } }
		console.log("Sending config to WebGS");
		socket.emit('config', config);
	}
	requestCurrentConfig();

	socket.on('configUpdate', function(data){
		console.log("Updating configuration");
		console.log(data);
		console.log(JSON2Config(data));
		//TODO: update copter and send back new config
		requestCurrentConfig();
	});

	socket.on('serialWrite', function(data){
		if(serial == null) {
			socket.emit('message', 'error', 'Unable to write to serial. Disconnected.');
			return;
		}

		serial.write(data);
	});

	/**
	 *	TODO: remove! Sending dummy data
	 */
	var data = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var sendData = function(i){
		setTimeout(function(){
			data[0] = new Date().getTime();
			
			setpoint = Math.sin(i * Math.PI / 180) * 100;
			if(setpoint < 0) setpoint += 254;
			data[8] = setpoint;
			
			thrust = Math.cos(i * Math.PI / 180) * 100;
			if(thrust < 0) thrust += 254;
			data[21] = thrust;

			data[1] = 127 + Math.sin(i * Math.PI / 180) * 127;
			data[2] = 127 + Math.cos(i * Math.PI / 180) * 127;
			data[3] = 127 + Math.sin(i * Math.PI / 180) * 127;
			data[4] = 127 + Math.cos(i * Math.PI / 180) * 127;
			data[5] = 127 + Math.sin(i * Math.PI / 180) * 127;
			data[6] = 127 + Math.cos(i * Math.PI / 180) * 127;

			if(i<361){
				data[11] = i / 180 * 127;
			} else if(i < 721) {
				data[12] = (i - 360) / 180 * 127;
			} else if(i < 1081) {
				data[13] = (i - 720) / 180 * 127;
			}

			socket.emit("data", streamMessageToJSON(data));

			if(i >=1080) {
				i = 0;
			}

			sendData(i+=5);

		}, 50);
	}

	setTimeout(function(){sendData(0)}, 1000);
});

var streamMessageToJSON = function(message){
	
	var r = {
		time: message[0],
		receiver: {
			throttle: message[1],
			aileron: message[2],
			elevator: message[3],
			rudder: message[4],
			gear: message[5],
			flaps: message[6],
		},
		setPoint: {
			vertical: message[7],
			roll: message[8] / 254 * 360,
			nick: message[9] / 254 * 360,
			yaw: message[10] / 254 * 360,
		},
		imu: {
			degree:{
				roll: message[11] / 254 * 360,
				nick: message[12] / 254 * 360,
				yaw: message[13] / 254 * 360,
			},
			rotation:{
				roll: message[14],
				nick: message[15],
				yaw: message[16],
			},
			acceleration:{
				x: message[17],
				y: message[18],
				z: message[19],
			}
		},
		output: {
			vertical: message[20],
			roll: message[21] / 254 * 360,
			nick: message[22] / 254 * 360,
			yaw: message[23] / 254 * 360,
		},
		mix: {
			leftThrust: message[24],
			rightThrust: message[25],
			rearThrust: message[26],
			servoPos: message[27],
		}
	};

	return r;
}

var JSON2Config = function(json){
	var config = new Array();
	config[0] = 
		((json.happykillmore)? Math.pow(2, 6) : 0) |
		((json.trigui)? Math.pow(2, 7) : 0) |
		((json.webgs)? Math.pow(2, 5) : 0) |
		((json.output.servo.rev)? Math.pow(2, 1) : 0);

	config[1] = json.output.motor.left.pin;
	config[2] = json.output.motor.right.pin;
	config[3] = json.output.motor.rear.pin;
	config[4] = json.output.servo.pin;

	config[5] = json.receiver.throttlemin;
	config[6] = json.output.motor.escarm;

	config[7] = mapByte(json.pid.hover.p, 'p', true);
	config[8] = mapByte(json.pid.hover.i, 'i', true);
	config[9] = json.pid.hover.d;
	config[10] = mapByte(json.pid.acro.p, 'p', true);
	config[11] = mapByte(json.pid.acro.i, 'i', true);
	config[12] = json.pid.acro.d;
	config[13] = mapByte(json.pid.yaw.p, 'p', true);
	config[14] = mapByte(json.pid.yaw.i, 'i', true);
	config[15] = json.pid.yaw.d;

	config[16] = 
		((json.receiver.throttle.rev)? Math.pow(2, 0) : 0) |
		((json.receiver.aileron.rev)? Math.pow(2, 1) : 0) |
		((json.receiver.elevator.rev)? Math.pow(2, 2) : 0) |
		((json.receiver.rudder.rev)? Math.pow(2, 3) : 0) |
		((json.receiver.gear.rev)? Math.pow(2, 4) : 0) |
		((json.receiver.flaps.rev)? Math.pow(2, 5) : 0);


	config[17] = json.imu.gyro.roll.pin;
	config[18] = json.imu.gyro.nick.pin;
	config[19] = json.imu.gyro.yaw.pin;
	config[20] = json.imu.accelerometer.roll.pin;
	config[21] = json.imu.accelerometer.nick.pin;
	config[22] = json.imu.accelerometer.vert.pin;

	config[23] = 
		((json.imu.gyro.roll.rev)? Math.pow(2, 0) : 0) |
		((json.imu.gyro.nick.rev)? Math.pow(2, 1) : 0) |
		((json.imu.gyro.yaw.rev)? Math.pow(2, 2) : 0) |
		((json.imu.accelerometer.roll.rev)? Math.pow(2, 3) : 0) |
		((json.imu.accelerometer.nick.rev)? Math.pow(2, 4) : 0) |
		((json.imu.accelerometer.vert.rev)? Math.pow(2, 5) : 0);

	config[24] = mapByte(json.imu.accelerometer.roll.trim, 'trim', true);
	config[25] = mapByte(json.imu.accelerometer.nick.trim, 'trim', true);
	config[26] = mapByte(json.imu.accelerometer.vert.trim, 'trim', true);

	config[27] = mapByte(json.imu.accelerometer.weight, 'accelWeight', true);

	return config;
}

var config2JSON = function(config){
	return {
		"happykillmore": Boolean(config[0] & Math.pow(2, 6)),
		"trigui":  Boolean(config[0] & Math.pow(2, 7)), 
		"webgs":  Boolean(config[0] & Math.pow(2, 5)),

		"receiver": { 
			"throttle": { 
				"rev": Boolean(config[16] & Math.pow(2, 0)) 
			}, 
			"aileron": { 
				"rev": Boolean(config[16] & Math.pow(2, 1)) 
			}, 
			"elevator": { 
				"rev": Boolean(config[16] & Math.pow(2, 2)) 
			}, 
			"rudder": { 
				"rev": Boolean(config[16] & Math.pow(2, 3)) 
			}, 
			"gear": { 
				"rev": Boolean(config[16] & Math.pow(2, 4)) 
			}, 
			"flaps": { 
				"rev": Boolean(config[16] & Math.pow(2, 5)) 
			}, 
			"throttlemin": config[5] 
		}, 

		"imu": { 
			"gyro": { 
				"roll": { 
					"pin": config[17], 
					"rev": Boolean(config[23] & Math.pow(2, 0))
				}, 
				"nick": { 
					"pin": config[18], 
					"rev": Boolean(config[23] & Math.pow(2, 1))
				}, 
				"yaw": { 
					"pin": config[19], 
					"rev": Boolean(config[23] & Math.pow(2, 2))
				} 
			}, 

			"accelerometer": { 
				"roll": { 
					"pin": config[20], 
					"rev": Boolean(config[23] & Math.pow(2, 3)), 
					"trim": mapByte(config[24], 'trim') 
				}, 
				"nick": { 
					"pin": config[21],
					"rev": Boolean(config[23] & Math.pow(2, 4)), 
					"trim": mapByte(config[25], 'trim') 
				}, 
				"vert": { 
					"pin": config[22], 
					"rev": Boolean(config[23] & Math.pow(2, 5)), 
					"trim": mapByte(config[26], 'trim') 
				}, 
				"weight": mapByte(config[27], 'accelWeight'),
			} 
		},

		"pid": {
			"hover": {
				"p": mapByte(config[7], 'p'),
				"i": mapByte(config[8], 'i'),
				"d": config[9] 
			}, 
			"acro": { 
				"p": mapByte(config[10], 'p'),
				"i": mapByte(config[11], 'i'),
				"d": config[12] 
			}, 
			"yaw": { 
				"p": mapByte(config[13], 'p'),
				"i": mapByte(config[14], 'i'),
				"d": config[15] 
			}
		},

		"output": { 
			"motor": { 
				"left": { 
					"pin": config[1] 
				}, 
				"right": { 
					"pin": config[2] 
				}, 
				"rear": { 
					"pin": config[3] 
				},
				"escarm": config[6]
			}, 
			"servo": { 
				"pin": config[4],
				"rev": Boolean(config[0] & Math.pow(2, 1)) 
			}
		}
	}
}

var mapByte = function(value, type, toDrone){
	var toDrone = toDrone || false;

	var drone_min = 0;
	var drone_max = 254;
	var webgs_min = 0;
	var webgs_max = 254;

	switch(type) {
		case 'p':
			drone_max = 200;
			webgs_max = 10;
			break;
		case 'i':
			drone_max = 200;
			webgs_max = 0.1;
			break;
		case 'accelWeight':
			drone_max = 200;
			webgs_max = 0.2;
			break;
		case 'trim':
			drone_max = 254;
			webgs_min = -127;
			webgs_max = 127;
			break;
	}


	if(toDrone) return map(value, webgs_min, webgs_max, drone_min, drone_max);
	else return map(value, drone_min, drone_max, webgs_min, webgs_max);
}

var map = function(x, in_min, in_max, out_min, out_max){
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

var byteStreamParser = function () {
    var delimiter = 255;

    var parityOdd = 0;
    var parityEven = 0;
    var data = new Array();
    var messages = new Array();
    return function (emitter, buffer) {
		// Collect data
		for (var i = 0; i < buffer.length; i++) {
			if (buffer[i] === delimiter) {

				//Last two bytes i parityBytes and should not be included in parity count
				if(data[data.length-1] % 2 == 0) parityEven--;
				else parityOdd--;
				if(data[data.length-2] % 2 == 0) parityEven--;
				else parityOdd--;

				//add valid message to messages
				if(		
						data[data.length-1] == parityEven &&
						data[data.length-2] == parityOdd
						){
					messages.push[data];
				} else {
					console.log("Invalid message received from serial connection:");
					console.log(data);
				}

				var parityOdd = 0;
				var parityEven = 0;
				data = new Array();
			} else {
				if(buffer[i] % 2 == 0) parityEven++;
				else parityOdd++;

				data.push(buffer[i]);
			}
		}

		while(message = messages.shift()){
			emitter.emit('data', message);
		}
	}
}