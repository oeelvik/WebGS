var app = angular.module('webGS', 
	[
		'ui.bootstrap', 
		'socket', 
		'console', 
		'serial', 
		'drone.config', 
		'instrument.graph-tricopter', 
		'instrument.attitude-indicator',
		'instrument.receiver',
		'instrument.pidChart',
		'instrument.vibrationChart',
	]
)

;