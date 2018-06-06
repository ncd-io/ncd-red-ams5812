module.exports = class AMS5915{
	constructor(addr, comm, config){
		if(typeof config != 'object') config = {};
		this.config = Object.assign({
			range: 5,
			sType: "d",
			tempScale: "c",
			pScale: "mbar"
		}, config);
		this.comm = comm;
		this.addr = addr;
		this.initialized = false;
		this.status = {};
		this.raw = [];
		this.init();
	}
	init(){
		this.get().then().catch();
	}
	parseStatus(status){
		var range = this.config.range;

		var min = 0,
			max = this.config.range;
		if(this.config.sType.toLowerCase() == "d-b") min -= max;
		else if(this.config.sType.toLowerCase() == "d") min = 700;

		var pCounts = ((status[0] & 0x3F) << 8) | status[1];
		var tCounts = (status[2] << 3) | ((status[3] & 0xE0) >> 5);
		//mbar
		this.status.pressure = ((pCounts - 1638) / (13107 / (max-min)) + min);
		//celsius
		this.status.temperature = ((tCounts * 200) / 2048) -50;

		if(this.config.tempScale.toLowerCase() == "f") this.status.temperature = this.status.temperature * 1.8 + 32;
		else if(this.config.tempScale.toLowerCase() == "k") this.status.temperature += 273.15;

		return this.status;
	}
	get(){
		return new Promise((fulfill, reject) => {
			this.comm.readBytes(this.addr, 4).then((r) => {
				this.initialized = true;
				fulfill(this.parseStatus(r));
			}).catch((err) => {
				this.initialized = false;
				reject(err);
			});
		});
	}
}
