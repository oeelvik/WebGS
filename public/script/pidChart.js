angular.module('instrument.pidChart',['socket'])

.directive('pidChart', function(){
	return {
		restrict: "E",
		scope: {
			maxlength: '=?',
			direction: '@'
		},
		link: function(scope, element, attrs){
			scope.chart = null;
			scope.updateCount = 0;

			scope.maxlength = scope.maxlength || 300;
			var options = {
				series: {
					shadowSize: 0	// Drawing is faster without shadows
				},
				yaxis: {
					min: -180,
					max: 180
				},
				xaxis: {
					show: false,
				}
            };

			scope.$watch('updateCount', function(){
                if(!scope.chart){
                    scope.chart = $.plot(element, scope.data , options);
                }else{
                    scope.chart.setData(scope.data);
                    scope.chart.setupGrid();
                    scope.chart.draw();
                }
            });
		},
		controller: function($scope, Socket){
			
			$scope.data = new Array();
			$scope.data.push({
				label: "SetPoint",
				data: new Array()
			});
			$scope.data.push({
				label: "Measurement",
				data: new Array()
			});
			$scope.data.push({
				label: "Thrust",
				data: new Array()
			});

			Socket.on('data', function(data){
				if(data.time && data.imu && data.output && data.setPoint) {


					var setpoint = (data.setPoint[$scope.direction] < 181) ? data.setPoint[$scope.direction] : data.setPoint[$scope.direction] - 360;
					var measurement = (data.imu.degree[$scope.direction] < 181) ? data.imu.degree[$scope.direction] : data.imu.degree[$scope.direction] - 360;
					var thrust = (data.output[$scope.direction] < 181) ? data.output[$scope.direction] : data.output[$scope.direction] - 360;

					//Break line if wraping around
					if(typeof $scope.data[0].data[$scope.data[0].data.length - 1] !== 'undefined' &&
						($scope.data[0].data[$scope.data[0].data.length - 1][1] - setpoint > 180 ||
						$scope.data[0].data[$scope.data[0].data.length - 1][1] - setpoint < -180
					)) $scope.data[0].data.push(null);

					if(typeof $scope.data[1].data[$scope.data[1].data.length - 1] !== 'undefined' &&
						($scope.data[1].data[$scope.data[1].data.length - 1][1] - measurement > 180 ||
						$scope.data[1].data[$scope.data[1].data.length - 1][1] - measurement < -180
					)) $scope.data[1].data.push(null);

					if(typeof $scope.data[2].data[$scope.data[2].data.length - 1] !== 'undefined' &&
						($scope.data[2].data[$scope.data[2].data.length - 1][1] - thrust > 180 ||
						$scope.data[2].data[$scope.data[2].data.length - 1][1] - thrust < -180
					)) $scope.data[2].data.push(null);

					$scope.data[0].data.push([data.time, setpoint]);
					$scope.data[1].data.push([data.time, measurement]);
					$scope.data[2].data.push([data.time, thrust]);
					
					if ($scope.data[0].data.length > $scope.maxlength){
						$scope.data[0].data = $scope.data[0].data.slice(1);
						$scope.data[1].data = $scope.data[1].data.slice(1);
						$scope.data[2].data = $scope.data[2].data.slice(1);
					}

					$scope.updateCount++;
				}
			});
		}
	}
})

;