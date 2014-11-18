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

	socket.on('listSerialPorts', function(data){
		serialPort.list(function (err, ports) {
			console.log("Avilable ports:");
			console.log(ports);
			socket.emit("serialPorts", []);//ports);
		});

		/**
		 *	TODO: remove! Sending dummy data
		 */
		var data = {attitude: {roll:0,nick:0,yaw:0}};
		var sendData = function(i){
			setTimeout(function(){
				if(i<361){
					data.attitude.roll = i / 180 * Math.PI;
				} else if(i < 721) {
					data.attitude.nick = (i - 360) / 180 * Math.PI;
				} else if(i < 1081) {
					data.attitude.yaw = (i - 720) / 180 * Math.PI;
				}

				socket.emit("data", data);

				if(i >=1080) {
					i = 0;
				}

				if(i % 360 == 0)
						setTimeout(function(){sendData(i+1)}, 1000);
					else
						sendData(i+1)
			}, 10);
		}

		setTimeout(function(){sendData(0)}, 1000);

	});

	var serialConnect = function(portName, baudRate){
		serial = new SerialPort(portName, {
			parser: serialPort.parsers.readline("\r\n"),
			baudRate: baudRate
		}, true, serialConnected);

		serial.on('data', function (data) {
			/*// Convert the string into a JSON object:
			var serialData = JSON.parse(data);
			// for debugging, you should see this in the terminal window:
			console.log(data);
			// send a serial event to the web client with the data:*/
			socket.emit('data', data);
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

	socket.on('serialWrite', function(data){
		if(serial == null) {
			socket.emit('message', 'error', 'Unable to write to serial. Disconnected.');
			return;
		}

		serial.write(data);
	});

	socket.on('configRequest', function(){
		//TODO: get config from copter
		var config = { "io": { "gyro": { "roll": { "pin": 1, "rev": false }, "nick": { "pin": 2, "rev": false }, "yaw": { "rev": false, "pin": 3 } }, "accelerometer": { "roll": { "pin": 4, "rev": true }, "nick": { "rev": true, "pin": 5 }, "yaw": { "rev": true, "pin": 6 } }, "motor": { "left": { "pin": 7 }, "right": { "pin": 8 }, "rear": { "pin": 9 } }, "servo": { "pin": 10, "rev": true } } }
		console.log("Config requested");
		socket.emit('config', config);
	});

	socket.on('configUpdate', function(data){
		console.log("Updating configuration");
		console.log(data);
		//TODO: update copter
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




});

