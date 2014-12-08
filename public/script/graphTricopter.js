angular.module('instrument.graph-tricopter',[])

.directive('graphTricopter', function(){
	return {
		restrict: "E",
		replace: true,
		scope: {},
		templateUrl: 'tpl/graphTricopter.tpl.html',
		link: function(scope, element, attrs){
			scope.context = element[0].getContext("2d");

			scope.reset();
		},
		controller: function($scope){
			$scope.reset = function(){
				//draw frame
				$scope.context.lineWidth = 10;
				$scope.context.beginPath();
				$scope.context.moveTo(150, 210);
				$scope.context.lineTo(150, 110);
				$scope.context.lineTo(240, 50);
				$scope.context.moveTo(150, 110);
				$scope.context.lineTo(60, 50);
				$scope.context.closePath();
				$scope.context.stroke();


				$scope.context.beginPath();

				$scope.context.arc(150, 210, 30, 0, 2 * Math.PI );
				$scope.context.moveTo(240, 50);
				$scope.context.arc(240, 50, 30, 0, 2 * Math.PI );
				$scope.context.moveTo(60, 50);
				$scope.context.arc(60, 50, 30, 0, 2 * Math.PI );
				$scope.context.closePath();
				$scope.context.lineWidth = 2;
				$scope.context.fillStyle = "#fff";
				$scope.context.stroke();
				$scope.context.fill();
			}

			$scope.setThrust = function(left, right, rear, yaw) {
				left = left / 360 + 0.5;
				right = right / 360 + 0.5;
				rear = rear / 360 + 0.5;
				yaw = yaw / 360 + 0.5;

				$scope.context.beginPath();
				$scope.context.arc(60, 50, 30, 0, 2 * Math.PI);
				$scope.context.closePath();
				var gradient = $scope.context.createRadialGradient(60,50,0,60,50,30);
				gradient.addColorStop(0, "red");
				gradient.addColorStop(left, "red");
				gradient.addColorStop(left + 0.2, "white");
				gradient.addColorStop(1, "white");
				$scope.context.fillStyle = gradient;
				$scope.context.fill();
				
				$scope.context.beginPath();
				$scope.context.arc(240, 50, 30, 0, 2 * Math.PI );
				$scope.context.closePath();
				var gradient = $scope.context.createRadialGradient(240,50,0,240,50,30);
				gradient.addColorStop(0, "red");
				gradient.addColorStop(right, "red");
				gradient.addColorStop(right + 0.2, "white");
				gradient.addColorStop(1, "white");
				$scope.context.fillStyle = gradient;
				$scope.context.fill();
				
				$scope.context.beginPath();
				$scope.context.arc(150, 210, 30, 0, 2 * Math.PI );
				$scope.context.closePath();
				var gradient = $scope.context.createRadialGradient(150,210,0,150,210,30);
				gradient.addColorStop(0, "red");
				gradient.addColorStop(rear, "red");
				gradient.addColorStop(rear + 0.2, "white");
				gradient.addColorStop(1, "white");
				$scope.context.fillStyle = gradient;
				$scope.context.fill();

				var gradient = $scope.context.createLinearGradient(10, 260, 290, 260);
				
				if(yaw > .5) {
					gradient.addColorStop(0, "white");
					gradient.addColorStop(.4999 , "white");
					gradient.addColorStop(.5, "red");
					gradient.addColorStop(yaw, "red");
					gradient.addColorStop(Math.min(yaw + .02, 1), "white");
					gradient.addColorStop(1, "white");

				}
				else {
					gradient.addColorStop(0, "white");
					gradient.addColorStop(Math.max(yaw - .02, 0), "white");
					gradient.addColorStop(yaw, "red");
					gradient.addColorStop(.5, "red");
					gradient.addColorStop(.5001 , "white");
					gradient.addColorStop(1, "white");
				}
				$scope.context.fillStyle = gradient;
				$scope.context.fillRect(10, 260, 280, 30);
			}

			$scope.$on('dataReceived', function(event, data){
				if(data.mix) {
					$scope.setThrust(data.mix.leftThrust, data.mix.rightThrust, data.mix.rearThrust, data.mix.servoPos);
				}
			});

		}
	}
})