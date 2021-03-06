angular.module('drone.com',['socket', 'console'])

.factory('DroneCom', function($rootScope, $timeout, Socket, Console){
	var MESSAGE_TYPE = {
		LOG: 0,
		INFO: 1,
		WARN: 2,
		ERROR: 3,

		CONFIG_REQUEST: 9,
		CONFIG: 10,

		DATA: 100,
	}

	var data2JSON = function(message){
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
				roll: (message[8] - 127) / 254 * 360,
				nick: (message[9] - 127) / 254 * 360,
				yaw: (message[10] - 127) / 254 * 360,
			},
			imu: {
				degree:{
					roll: (message[11] - 127) / 254 * 360,
					nick: (message[12] - 127) / 254 * 360,
					yaw: (message[13] - 127) / 254 * 360,
				},
				rotation:{
					roll: message[14],
					nick: message[15],
					yaw: message[16],
				},
				acceleration:{
					x: (message[17] - 127) * 2,
					y: (message[18] - 127) * 2,
					z: (message[19] - 127) * 2,
				}
			},
			output: {
				vertical: message[20],
				roll: (message[21] - 127) / 254 * 360,
				nick: (message[22] - 127) / 254 * 360,
				yaw: (message[23] - 127) / 254 * 360,
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
		config[7] = json.output.motor.spinup;

		config[8] = mapByte(json.pid.hover.p, 'p', true);
		config[9] = mapByte(json.pid.hover.i, 'i', true);
		config[10] = mapByte(json.pid.hover.d, 'd', true);
		config[11] = mapByte(json.pid.acro.p, 'p', true);
		config[12] = mapByte(json.pid.acro.i, 'i', true);
		config[13] = mapByte(json.pid.acro.d, 'd', true);
		config[14] = mapByte(json.pid.yaw.p, 'p', true);
		config[15] = mapByte(json.pid.yaw.i, 'i', true);
		config[16] = mapByte(json.pid.yaw.d, 'd', true);

		config[17] = 
			((json.receiver.throttle.rev)? Math.pow(2, 0) : 0) |
			((json.receiver.aileron.rev)? Math.pow(2, 1) : 0) |
			((json.receiver.elevator.rev)? Math.pow(2, 2) : 0) |
			((json.receiver.rudder.rev)? Math.pow(2, 3) : 0) |
			((json.receiver.gear.rev)? Math.pow(2, 4) : 0) |
			((json.receiver.flaps.rev)? Math.pow(2, 5) : 0);


		config[18] = json.imu.gyro.roll.pin;
		config[19] = json.imu.gyro.nick.pin;
		config[20] = json.imu.gyro.yaw.pin;
		config[21] = json.imu.accelerometer.roll.pin;
		config[22] = json.imu.accelerometer.nick.pin;
		config[23] = json.imu.accelerometer.vert.pin;

		config[24] = 
			((json.imu.gyro.roll.rev)? Math.pow(2, 0) : 0) |
			((json.imu.gyro.nick.rev)? Math.pow(2, 1) : 0) |
			((json.imu.gyro.yaw.rev)? Math.pow(2, 2) : 0) |
			((json.imu.accelerometer.roll.rev)? Math.pow(2, 3) : 0) |
			((json.imu.accelerometer.nick.rev)? Math.pow(2, 4) : 0) |
			((json.imu.accelerometer.vert.rev)? Math.pow(2, 5) : 0);

		config[25] = mapByte(json.imu.accelerometer.roll.trim, 'trim', true);
		config[26] = mapByte(json.imu.accelerometer.nick.trim, 'trim', true);
		config[27] = mapByte(json.imu.accelerometer.vert.trim, 'trim', true);

		config[28] = mapByte(json.imu.accelerometer.weight, 'accelWeight', true);

		//limit all values to integers between 0 <-> 254
		for(var i = 0; i < config.length; i++){
			config[i] = Math.round(config[i]);
			if(config[i] > 254) config[i] == 254;
			if(config[i] < 0) config[i] == 0;
		}

		return config;
	}

	var config2JSON = function(config){
		return {
			"happykillmore": Boolean(config[0] & Math.pow(2, 6)),
			"trigui":  Boolean(config[0] & Math.pow(2, 7)), 
			"webgs":  Boolean(config[0] & Math.pow(2, 5)),

			"receiver": { 
				"throttle": { 
					"rev": Boolean(config[17] & Math.pow(2, 0)) 
				}, 
				"aileron": { 
					"rev": Boolean(config[17] & Math.pow(2, 1)) 
				}, 
				"elevator": { 
					"rev": Boolean(config[17] & Math.pow(2, 2)) 
				}, 
				"rudder": { 
					"rev": Boolean(config[17] & Math.pow(2, 3)) 
				}, 
				"gear": { 
					"rev": Boolean(config[17] & Math.pow(2, 4)) 
				}, 
				"flaps": { 
					"rev": Boolean(config[17] & Math.pow(2, 5)) 
				}, 
				"throttlemin": config[5] 
			}, 

			"imu": { 
				"gyro": { 
					"roll": { 
						"pin": config[18], 
						"rev": Boolean(config[24] & Math.pow(2, 0))
					}, 
					"nick": { 
						"pin": config[19], 
						"rev": Boolean(config[24] & Math.pow(2, 1))
					}, 
					"yaw": { 
						"pin": config[20], 
						"rev": Boolean(config[24] & Math.pow(2, 2))
					} 
				}, 

				"accelerometer": { 
					"roll": { 
						"pin": config[21], 
						"rev": Boolean(config[24] & Math.pow(2, 3)), 
						"trim": mapByte(config[25], 'trim') 
					}, 
					"nick": { 
						"pin": config[22],
						"rev": Boolean(config[24] & Math.pow(2, 4)), 
						"trim": mapByte(config[26], 'trim') 
					}, 
					"vert": { 
						"pin": config[23], 
						"rev": Boolean(config[24] & Math.pow(2, 5)), 
						"trim": mapByte(config[27], 'trim') 
					}, 
					"weight": mapByte(config[28], 'accelWeight'),
				} 
			},

			"pid": {
				"hover": {
					"p": mapByte(config[8], 'p'),
					"i": mapByte(config[9], 'i'),
					"d": mapByte(config[10], 'd') 
				}, 
				"acro": { 
					"p": mapByte(config[11], 'p'),
					"i": mapByte(config[12], 'i'),
					"d": mapByte(config[13], 'd') 
				}, 
				"yaw": { 
					"p": mapByte(config[14], 'p'),
					"i": mapByte(config[15], 'i'),
					"d": mapByte(config[16], 'd') 
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
					"escarm": config[6],
					"spinup": config[7]
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
				webgs_max = 10;
				drone_max = 200;
				break;
			case 'i':
				webgs_max = 10;
				drone_max = 200;
				break;
			case 'd':
				webgs_max = 10;
				drone_max = 200;
				break;
			case 'accelWeight':
				webgs_max = 0.1;
				drone_max = 250;
				break;
			case 'trim':
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

	var byteArray2String = function(array){
		var result = "";
		for (var i = 0; i < array.length; i++) {
			result += String.fromCharCode(array[i]);
		}
		return result;
	}

	Socket.on('data', function(message){
		var type = message.shift();
		switch (type) {
			case MESSAGE_TYPE.LOG:
				Console.log("DRONE: " + byteArray2String(message));
				break;
			case MESSAGE_TYPE.INFO:
				Console.info("DRONE: " + byteArray2String(message));
				break;
			case MESSAGE_TYPE.WARN:
				Console.warn("DRONE: " + byteArray2String(message));
				break;
			case MESSAGE_TYPE.ERROR:
				Console.error("DRONE: " + byteArray2String(message));
				break;
			case MESSAGE_TYPE.CONFIG:
				$rootScope.$broadcast('configReceived', config2JSON(message));
				break;
			/* TODO: tricopter should automatically return config when config is done
			case MESSAGE_TYPE.CONFIG_DONE:
				requestCurrentConfig();
				break;*/
			case MESSAGE_TYPE.DATA: //DATA
				$rootScope.$broadcast('dataReceived', data2JSON(message));
				break;
			default:
				Consol.error('Unknown message type received from drone: ' + type);
		}
	});

	Socket.on("serialConnected", function(){
		//Wait while arduino is reset
		$timeout(function(){
			Socket.emit("data", [MESSAGE_TYPE.CONFIG_REQUEST]);
		}, 5000);
	});

	var droneCom = {
		setConfig: function(json){
			var config = JSON2Config(json);
			config.unshift(MESSAGE_TYPE.CONFIG);

			Socket.emit("data", config);
		}
	}

	return droneCom;
})

;