angular.module('instrument.attitude-indicator',[])

.directive('attitudeIndicator', function(){
	return {
		restrict: "E",
		replace: true,
		scope: {},
		templateUrl: 'tpl/attitudeIndicator.tpl.html',
		link: function(scope, element, attrs){
			scope.context = element[0].getContext("2d");
			scope.context.translate(150, 150);

			scope.update(0, 0);
		},
		controller: function($scope){

			$scope.centerImage = document.createElement('canvas');
			$scope.centerImage.width = 300;
			$scope.centerImage.height = 900;
			$scope.centerImage.context = $scope.centerImage.getContext("2d");

			var gradient = $scope.centerImage.context.createLinearGradient(0,0,0,900);
			gradient.addColorStop(0, "#417DFF");
			gradient.addColorStop(.5, "#417DFF");
			gradient.addColorStop(.50001, "#8A5021");
			gradient.addColorStop(1, "#8A5021");
			$scope.centerImage.context.fillStyle = gradient;
			$scope.centerImage.context.fillRect(0,0,300,900);

			
			$scope.centerImage.context.strokeStyle = "#fff";
			$scope.centerImage.context.fillStyle = "#fff";
			$scope.centerImage.context.textAlign = "center";
			$scope.centerImage.context.textBaseline = "middle";
			$scope.centerImage.context.font = "14px monoscript";
			$scope.centerImage.context.lineWidth = 2;
			$scope.centerImage.context.beginPath();
			$scope.centerImage.context.moveTo(0, 450);
			$scope.centerImage.context.lineTo(300, 450);

			for(var i = 10; i < 90; i += 10){
				$scope.centerImage.context.moveTo(130, 450 - (i - 5) * 5);
				$scope.centerImage.context.lineTo(170, 450 - (i - 5) * 5);
				$scope.centerImage.context.moveTo(110, 450 - (i * 5));
				$scope.centerImage.context.lineTo(190, 450 - (i * 5));
				$scope.centerImage.context.fillText(i, 210, 450 - (i * 5));
				$scope.centerImage.context.fillText(i, 90, 450 - (i * 5));
				$scope.centerImage.context.moveTo(130, 450 + (i - 5) * 5);
				$scope.centerImage.context.lineTo(170, 450 + (i - 5) * 5);
				$scope.centerImage.context.moveTo(110, 450 + (i * 5));
				$scope.centerImage.context.lineTo(190, 450 + (i * 5));
				$scope.centerImage.context.fillText("-" + i, 210, 450 + (i * 5));
				$scope.centerImage.context.fillText("-" + i, 90, 450 + (i * 5));
			}
			$scope.centerImage.context.closePath();
			$scope.centerImage.context.stroke();

			$scope.centerImage2 = document.createElement('canvas');
			$scope.centerImage2.width = 300;
			$scope.centerImage2.height = 900;
			$scope.centerImage2.context = $scope.centerImage2.getContext("2d");
			$scope.centerImage2.context.translate(150, 450);
			$scope.centerImage2.context.rotate(Math.PI);
			$scope.centerImage2.context.drawImage($scope.centerImage, -150, -450);

			$scope.ringImage = document.createElement('canvas');
			$scope.ringImage.width = 300;
			$scope.ringImage.height = 300;
			$scope.ringImage.context = $scope.ringImage.getContext("2d");

			var gradient = $scope.ringImage.context.createLinearGradient(0,0,0,300);
			gradient.addColorStop(0, "#417DFF");
			gradient.addColorStop(.5, "#417DFF");
			gradient.addColorStop(.50001, "#8A5021");
			gradient.addColorStop(1, "#8A5021");
			$scope.ringImage.context.fillStyle = gradient;
			$scope.ringImage.context.fillRect(0,0,300,300);

			$scope.ringImage.context.strokeStyle = "#fff";
			$scope.ringImage.context.lineWidth = 2;
			$scope.ringImage.context.beginPath();
			$scope.ringImage.context.moveTo(0, 150);
			$scope.ringImage.context.lineTo(300, 150);


			$scope.ringImage.context.moveTo(250, 150);
			$scope.ringImage.context.arc(150, 150, 100, 0, 2 * Math.PI);

			$scope.ringImage.context.translate(150, 150);
			angular.forEach([-80, -70, -60, -30, 30, 60, 70, 80, 90], function(value, index){
				var rotation = value / 180 * Math.PI
				$scope.ringImage.context.rotate(rotation);
				$scope.ringImage.context.moveTo(0, 0);
				var length = (value % 30 == 0) ? 125 : 110;
				if(value < 0)
					$scope.ringImage.context.lineTo(length, 0);
				else
					$scope.ringImage.context.lineTo(-length, 0);
				$scope.ringImage.context.rotate(-rotation);
			});
			$scope.ringImage.context.translate(-150, -150);

			$scope.ringImage.context.closePath();
			$scope.ringImage.context.stroke();

			$scope.ringImage.context.globalCompositeOperation = 'xor';
			$scope.ringImage.context.arc(150, 150, 100, 0, 2 * Math.PI);
			$scope.ringImage.context.fill();
			$scope.ringImage.context.globalCompositeOperation = 'source-over';



			$scope.frameImage = document.createElement('canvas');
			$scope.frameImage.width = 300;
			$scope.frameImage.height = 300;
			$scope.frameImage.context = $scope.frameImage.getContext("2d");

			$scope.frameImage.context.fillStyle = "#000";
			$scope.frameImage.context.fillRect(0,0,300,300);

			$scope.frameImage.context.globalCompositeOperation = 'xor';
			$scope.frameImage.context.beginPath();
			$scope.frameImage.context.arc(150, 150, 125, 0, 2 * Math.PI);
			$scope.frameImage.context.closePath();
			$scope.frameImage.context.fill();
			$scope.frameImage.context.globalCompositeOperation = 'source-over';

			$scope.frameImage.context.strokeStyle = "yellow";
			$scope.frameImage.context.lineWidth = 3;

			$scope.frameImage.context.beginPath();
			$scope.frameImage.context.moveTo(150, 52);
			$scope.frameImage.context.lineTo(145, 65);
			$scope.frameImage.context.lineTo(155, 65);
			$scope.frameImage.context.lineTo(150, 52);

			$scope.frameImage.context.moveTo(134, 157);
			$scope.frameImage.context.lineTo(134, 150);
			$scope.frameImage.context.lineTo(100, 150);
			$scope.frameImage.context.moveTo(165, 157);
			$scope.frameImage.context.lineTo(165, 150);
			$scope.frameImage.context.lineTo(200, 150);
			
			$scope.frameImage.context.moveTo(148.5, 150);
			$scope.frameImage.context.lineTo(151.5, 150);
			$scope.frameImage.context.stroke();

			/**
			 * roll = roll in radians
			 * nick = nick in radians
			 */
			$scope.update = function(roll, nick){
				//Sett nick and roll in the range of 0 -> 2*PI
				nick = nick % (Math.PI * 2);
				if(nick < 0) {
					nick = nick + (Math.PI * 2);
				}

				roll = roll % (Math.PI * 2);
				if(roll < 0) {
					roll = roll + (Math.PI * 2);
				}

				$scope.context.rotate(roll);

				//Show center using nick
				$scope.context.drawImage($scope.centerImage2, -150, -1350 + (nick / (Math.PI / 2) * 450));
				if(nick < Math.PI) {
					$scope.context.drawImage($scope.centerImage, -150, -450 + (nick / (Math.PI / 2) * 450));
				} else {
					$scope.context.drawImage($scope.centerImage, -150, -2250 + (nick / (Math.PI / 2) * 450));
				}

				$scope.context.drawImage($scope.ringImage, -150, -150);


				$scope.context.rotate(-roll);
				$scope.context.drawImage($scope.frameImage, -150, -150);


			}

		}
	}

})