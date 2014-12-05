angular.module('instrument.receiver',[])

.directive('receiver', function(){
	return {
		restrict: "E",
		scope: {},
		link: function(scope, element, attrs){
			scope.updateCount = 0;

			var options = {
				series: {
					bars: {
						show: true,
						barWidth: 0.8,
						align: "center"
					}
				},
				yaxis: {
					show: false,
					min: 0,
					max: 254
				},
				xaxis: {
					ticks: [[0, "Throttle"], [1, "Aileron"], [2, "Elevator"], [3, "Rudder"], [4, "Gear"], [5, "Flaps"]],
					tickLength:0
				},
            };

			scope.$watch('updateCount', function(){
                if(!scope.chart){
                    scope.chart = $.plot(element, [scope.data] , options);
                }else{
                    scope.chart.setData([scope.data]);
                    scope.chart.draw();
                }
            });
		},
		controller: function($scope){
			$scope.data = new Array();
			$scope.data.push(new Array(0, 0));
			$scope.data.push(new Array(1, 0));
			$scope.data.push(new Array(2, 0));
			$scope.data.push(new Array(3, 0));
			$scope.data.push(new Array(4, 0));
			$scope.data.push(new Array(5, 0));

			$scope.$on('dataReceived', function(event, data){
				if(data.receiver) {
					$scope.data[0][1] = data.receiver.throttle;
					$scope.data[1][1] = data.receiver.aileron;
					$scope.data[2][1] = data.receiver.elevator;
					$scope.data[3][1] = data.receiver.rudder;
					$scope.data[4][1] = data.receiver.gear;
					$scope.data[5][1] = data.receiver.flaps;

					$scope.updateCount++;
				}
			});
		}
	}
})

;