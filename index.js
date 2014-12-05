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
			socket.emit("serialPorts", ports);
		});
	}
	listSerialPorts();

	var serialConnect = function(portName, baudRate){
		serial = new SerialPort(portName, {
			parser: fromSerialParser(),
			baudRate: baudRate
		}, true, serialConnected);
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
			console.log('Failed to open serial connection: '+error);
			socket.emit("message", "error", 'Failed to open serial connection: '+error);
			serial = null;
		} else {

			serial.on('data', function (data) {
				socket.emit('data', data);
			});

			socket.emit("serialConnected");
		}
	}

	var serialDisconnected = function(error){
		if ( error ) {
			console.log('Failed to close serial connection: '+error);
			socket.emit("message", "error", 'Failed to close serial connection: '+error);
		} else {
			socket.emit("serialDisconnected");
			serial = null;
		}
	}

	socket.on('data', function(data){
		console.log("Attemt to send message to drone:");
		console.log(toSerialMessage(data));

		if(serial == null) {
			socket.emit('message', 'error', 'Unable to write to serial. Disconnected.');
			return;
		}

		serial.write(toSerialMessage(data), function(error, results) {
			if(error) socket.emit('message', 'error', 'Unable to send data to drone: ' + error);
			else console.log('results ' + results);
		});
	});

	//node index.js test = send dummy test data
	if(process.argv[2] == 'test'){
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

				data.unshift(100);
				socket.emit("data", data);
				data.shift();

				if(i >=1080) {
					i = 0;
				}

				sendData(i+=5);

			}, 50);
		}

		setTimeout(function(){sendData(0)}, 1000);
	}
});

var DRONE_MESSAGE_HEADER = 255;
var toSerialMessage = function(data){
	data = data || new Array();

	var odd = 0;
	var even = 0;
	for(var i = 0; i < data.length; i++){
		if(data[i] % 2 == 0) even++;
		else odd++;
	}

	data.unshift(DRONE_MESSAGE_HEADER);
	data.push(odd, even, DRONE_MESSAGE_HEADER);

	return data;
}


var fromSerialParser = function () {
    var delimiter = DRONE_MESSAGE_HEADER;

    var parityOdd = 0;
    var parityEven = 0;
    var data = new Array();
    var messages = new Array();
    return function (emitter, buffer) {
		// Collect data
		for (var i = 0; i < buffer.length; i++) {
			if (buffer[i] === delimiter && data.length > 2) {

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

					//Remove parityBytes
					data.pop();
					data.pop();

					//add valid message to messages
					messages.push[data];
				} else {
					console.error("Invalid message received from serial connection:");
					console.error(data);
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

		//emit all valid messages
		while(message = messages.shift()){
			emitter.emit('data', message);
		}
	}
}