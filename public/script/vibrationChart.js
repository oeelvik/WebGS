angular.module('instrument.vibrationChart',[])

.directive('vibrationChart', function(){
	return {
		restrict: "E",
		scope: {
			maxlength: '=?'
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
					min: -17,
					max: 7
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
		controller: function($scope){
			
			$scope.data = new Array();
			$scope.data.push({
				label: "X",
				data: new Array()
			});
			$scope.data.push({
				label: "Y",
				data: new Array()
			});
			$scope.data.push({
				color: "grey",
				label: "Z",
				data: new Array()
			});


			$scope.data.push({color:"red", label: "Limits", data: new Array()});
			$scope.data.push({color:"red", data: new Array()});
			$scope.data.push({color:"red", data: new Array()});
			$scope.data.push({color:"red", data: new Array()});

			$scope.$on('dataReceived', function(event, data){
				if(data.imu) {
					var time = new Date().getTime();


					var x = data.imu.acceleration.x;
					var y = data.imu.acceleration.y;
					var z = data.imu.acceleration.z;

					$scope.data[0].data.push([time, x]);
					$scope.data[1].data.push([time, y]);
					$scope.data[2].data.push([time, z]);

					$scope.data[3].data.push([time, 3]);
					$scope.data[4].data.push([time, -3]);
					$scope.data[5].data.push([time, -5]);
					$scope.data[6].data.push([time, -15]);
					
					//Limit data arrays
					if ($scope.data[0].data.length > $scope.maxlength){
						$scope.data[0].data = $scope.data[0].data.slice($scope.data[0].data.length - $scope.maxlength);
					}

					if ($scope.data[1].data.length > $scope.maxlength){
						$scope.data[1].data = $scope.data[1].data.slice($scope.data[1].data.length - $scope.maxlength);
					}

					if ($scope.data[2].data.length > $scope.maxlength){
						$scope.data[2].data = $scope.data[2].data.slice($scope.data[2].data.length - $scope.maxlength);
					}


					if ($scope.data[3].data.length > $scope.maxlength){
						$scope.data[3].data = $scope.data[3].data.slice($scope.data[3].data.length - $scope.maxlength);
						$scope.data[4].data = $scope.data[4].data.slice($scope.data[4].data.length - $scope.maxlength);
						$scope.data[5].data = $scope.data[5].data.slice($scope.data[5].data.length - $scope.maxlength);
						$scope.data[6].data = $scope.data[6].data.slice($scope.data[6].data.length - $scope.maxlength);
					}

					$scope.updateCount++;
				}
			});
		}
	}
})

;