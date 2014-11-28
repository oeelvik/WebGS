angular.module('drone.config',['socket'])

.factory('Config', function(Socket){
	var conf =  {
		master: {},
		data: {},

		isUnchanged: function() {
	    	return angular.equals(this.data, this.master);
		},

		submit: function(){
			Socket.emit("configUpdate", this.data);

			//TODO: Uptade master on success
		}
	}

	Socket.on("config", function(data){
		conf.master = data;
		conf.data = angular.copy(conf.master);
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

.directive('configIo', function(){
	return {
		restrict: "E",
		replace: true,
		templateUrl: 'tpl/configIo.tpl.html',
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