angular.module('console',['socket'])

.factory('Console', function(){
	return {
		rows: 100,
		messages: [],
		add: function(type, message){
			if (typeof message == "object") message = angular.toJson(message, true);
			this.messages.unshift({
				'type': type,
				'message': message,
			});

			if(this.messages.length > this.rows)
				this.messages.splice(this.rows - this.messages.length);
		},
		log: function(message){
			this.add("log", message);
			console.log(message);
		},
		info: function(message){
			this.add("info", message);
			console.info(message);
		},
		warn: function(message){
			this.add("warn", message);
			console.warn(message);
		},
		error: function(message){
			this.add("error", message);
			console.error(message);
		},

	}
})

.directive('console', function(){
	return {
		restrict: "E",
		replace: true,
		scope: {
			rows: '@'
		},
		templateUrl: 'tpl/console.tpl.html',
		link: function(scope, element, attrs){
			scope.newMessages = 0;

			$('li[heading="Console"] a').append(' <span class="badge"></span>');
			$('li[heading="Console"] a').on('click', function(){
				scope.newMessages = 0;
			});

			scope.$watch('newMessages', function(val){
				if(!$('div.console').parent().is(':visible') && val > 0){
					$('li[heading="Console"] a .badge').text(val);
				} else {
					$('li[heading="Console"] a .badge').text('');
				}
			});
		},
		controller: function($scope, Console, Socket){
			$scope.service = Console;
			if($scope.rows)	Console.rows = $scope.rows;

			Socket.on("message", function(type, message){
				if (typeof message == "object") message = angular.toJson(message, true);

				switch (type.toLowerCase()) {
					case 'info':
						Console.info("SERVER: " + message);
						break;
					case 'warn':
						Console.warn("SERVER: " + message);
						break;
					case 'error':
						Console.error("SERVER: " + message);
						break;
					default:
						Console.log("SERVER: " + message);
						break;
				}
			});

			$scope.$watch('service.messages[0]', function(val){
				if($('div.console').is(':visible'))
					$scope.newMessages = 0;
				else if(typeof val != 'undefined'){
					$scope.newMessages++;
				}
			});
		}
	}
})