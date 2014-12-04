angular.module('drone.config',['socket'])

.factory('Config', function(Socket){
	var conf =  {
		default: {
			"webgs": true,

			"receiver": { 
				"elevator": { 
					"rev": true 
				}, 
				"rudder": { 
					"rev": true 
				}, 
				"throttlemin": 50 
			}, 

			"imu": { 
				"gyro": { 
					"roll": { 
						"pin": 4 
					}, 
					"nick": { 
						"pin": 3 
					}, 
					"yaw": { 
						"pin": 5 
					} 
				}, 

				"accelerometer": { 
					"roll": { 
						"pin": 1, 
						"rev": true, 
						"trim": 0 
					}, 
					"nick": { 
						"pin": 2, 
						"trim": 0 
					}, 
					"vert": { 
						"pin": 1, 
						"rev": true, 
						"trim": 0 
					}, 
					"weight": 0.04 
				} 
			},

			"pid": {
				"hover": {
					"p": 1.2, 
					"i": 0.009, 
					"d": 60 
				}, 
				"acro": { 
					"i": 0.002, 
					"p": 1, 
					"d": 45 
				}, 
				"yaw": { 
					"p": 1, 
					"i": 0.002, 
					"d": 45 
				}
			},

			"output": { 
				"motor": { 
					"left": { 
						"pin": 11 
					}, 
					"right": { 
						"pin": 10 
					}, 
					"rear": { 
						"pin": 9 
					},
					"escarm": 22
				}, 
				"servo": { 
					"pin": 3,
					"rev": true 
				}
			}
		},

		isCurrent: function() {
	    	return angular.equals(this.data, this.current);
		},

		isDefault: function() {
	    	return angular.equals(this.data, this.default);
		},

		submit: function(){
			Socket.emit("configUpdate", this.data);

			//TODO: Uptade current on success
		},

		useDefault: function(){
			conf.data = angular.copy(conf.default);
		},

		cansel: function(){
			conf.data = angular.copy(conf.current);
		}
	}
	conf.current = angular.copy(conf.default);
	conf.data = angular.copy(conf.default);

	Socket.on("config", function(data){
		conf.current = data;
		conf.data = angular.copy(conf.current);
	});

	return conf;
})

.directive('configMain', function(){
	return {
		restrict: "E",
		replace: true,
		templateUrl: 'tpl/configMain.tpl.html',
		controller: 'ConfigCtrl'
	}
})

.directive('configReceiver', function(){
	return {
		restrict: "E",
		replace: true,
		templateUrl: 'tpl/configReceiver.tpl.html',
		controller: 'ConfigCtrl'
	}
})

.directive('configImu', function(){
	return {
		restrict: "E",
		replace: true,
		templateUrl: 'tpl/configImu.tpl.html',
		controller: 'ConfigCtrl'
	}
})

.directive('configMotors', function(){
	return {
		restrict: "E",
		replace: true,
		templateUrl: 'tpl/configMotors.tpl.html',
		controller: 'ConfigCtrl'
	}
})

.directive('configPid', function(){
	return {
		restrict: "E",
		replace: true,
		templateUrl: 'tpl/configPid.tpl.html',
		controller: 'ConfigCtrl'
	}
})

.controller('ConfigCtrl', function($scope, Config){
	$scope.config = Config;
})