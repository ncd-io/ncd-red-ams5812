"use strict";

const AMS5812 = require("./index.js");
const Queue = require("promise-queue");

module.exports = function(RED){
	var sensor_pool = {};
	var loaded = [];

	function NcdI2cDeviceNode(config){
		RED.nodes.createNode(this, config);
		this.interval = parseInt(config.interval);
		this.addr = 0x78;
		if(typeof sensor_pool[this.id] != 'undefined'){
			//Redeployment
			clearTimeout(sensor_pool[this.id].timeout);
			delete(sensor_pool[this.id]);
		}

		this.sensor = new AMS5812(this.addr, RED.nodes.getNode(config.connection).i2c, config);

		var node = this;

		sensor_pool[this.id] = {
			sensor: this.sensor,
			polling: false,
			timeout: 0,
			node: this
		}

		function device_status(){
			if(!node.sensor.initialized){
				node.status({fill:"red",shape:"ring",text:"disconnected"});
				return false;
			}
			node.status({fill:"green",shape:"dot",text:"connected"});
			return true;
		}

		function send_payload(_status){
			var msg = [
				{topic: 'pressure', payload: _status.pressure},
				{topic: 'temperature', payload: _status.temperature},
			];
			node.send(msg);
		}

		function get_status(repeat, force){
			if(repeat) clearTimeout(sensor_pool[node.id].timeout);
			if(device_status(node)){
				node.sensor.get().then(send_payload).catch((err) => {
					node.send({error: err});
				}).then(() => {
					if(repeat && node.interval){
						clearTimeout(sensor_pool[node.id].timeout);
						sensor_pool[node.id].timeout = setTimeout(() => {
							if(typeof sensor_pool[node.id] != 'undefined') get_status(true);
						}, sensor_pool[node.id].node.interval);
					}else{
						sensor_pool[node.id].polling = false;
					}
				});
			}else{
				sensor_pool[node.id].timeout = setTimeout(() => {
					node.sensor.init();
					if(typeof sensor_pool[node.id] != 'undefined') get_status(true);
				}, 3000);
			}
		}

		get_status(node.interval && !sensor_pool[node.id].polling);

		node.on('input', (msg) => {
			if(msg.topic == 'get_status'){
				get_status(false);
			}
		});

		node.on('close', (removed, done) => {
			if(removed){
				clearTimeout(sensor_pool[node.id].timeout);
				delete(sensor_pool[node.id]);
			}
			done();
		});
	}
	RED.nodes.registerType("ncd-ams5812", NcdI2cDeviceNode)
}
