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
			sendCurrentConfig();
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

	var sendCurrentConfig = function(){
		//TODO: get config from copter if avilable
		var config = { "imu": { "gyro": { "roll": { "pin": 1, "rev": false }, "nick": { "pin": 2, "rev": false }, "yaw": { "rev": false, "pin": 3 } }, "accelerometer": { "roll": { "pin": 4, "rev": true }, "nick": { "rev": true, "pin": 5 }, "yaw": { "rev": true, "pin": 6 } } } }
		console.log("Sending config to WebGS");
		socket.emit('config', config);
	}
	sendCurrentConfig();

	socket.on('configUpdate', function(data){
		console.log("Updating configuration");
		console.log(data);
		//TODO: update copter and send back new config
		sendCurrentConfig();
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