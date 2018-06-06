var comms = require('ncd-red-comm');
var AMS5915 = require('./index.js');

/*
 * Allows use of a USB to I2C converter form ncd.io
 */
var port = '/dev/tty.usbserial-DN03Q7F9';
var serial = new comms.NcdSerial('/dev/tty.usbserial-DN03Q7F9', 115200);
var comm = new comms.NcdSerialI2C(serial, 0);

/*
 * Use the native I2C port on the Raspberry Pi
 */
//var comm = new comms.NcdI2C(1);

var config = {
	range: 5,
	sType: "d-b",
	tempScale: "f"
};
var dac = new AMS5915(0x28, comm, config);

function testGet(){
	dac.get().then((r) => {
		console.log(r);
		setTimeout(testGet, 1000);
	}).catch(console.log);
}

testGet();
