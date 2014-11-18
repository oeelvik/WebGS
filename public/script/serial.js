angular.module('serial',['socket', 'console'])

.factory('Serial', function($rootScope, Socket, Console){

	Socket.emit('listSerialPorts');

	var serial = {
		connected: false,
		ports: [],
		portname: null,
		baudrate: 115200,
		connect: function(){
			Socket.emit('serialConnect', this.portname, this.baudrate);
		},
		disconnect: function(){
			Socket.emit('serialDisconnect');
		}
	}

	Socket.on("serialPorts", function(ports){
		serial.ports = ports;
		console.log(ports);
		if(ports.length < 1) Console.warn("No serialports available");
		else serial.portname = ports[0].comName;
	});

	Socket.on("serialConnected", function(){
		serial.connected = true;
		Socket.emit("configRequest");
	});

	Socket.on("serialDisconnected", function(){
		serial.connected = false;
	});

	Socket.on("serialRead", function(){
		$rootScope.$broadcast('serialRead');
	});

	return serial;
})

.directive('serial', function(){
	return {
		restrict: "E",
		replace: true,
		scope: {},
		templateUrl: 'tpl/serial.tpl.html',
		controller: function($scope, Serial){
			$scope.service = Serial;
		},
	}
})