angular.module('socket',['btford.socket-io'])

.factory('Socket', function(socketFactory){
	socket = socketFactory();
	return socket;
})