/*
	License

	This work is licensed under the Creative Commons Attribution 4.0 International License.
	To view a copy of this license, visit http://creativecommons.org/licenses/by-nd/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.

	Name: 		websocket connection and messages / time count
	Date: 		Feb 14 2024
	Author:		@vir2alexport
	License:	https://creativecommons.org/licenses/by-nd/4.0/legalcode
*/

let timeout = 0;

const lapse = 3600;
const subscription_id = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split('').sort(function(){return 0.5-Math.random()}).join('');


/*
	
*/
self.addEventListener("message", (e)=>{
	let result = [];
	//
	if(e.data[0] == "setSettings"){
		timeout = e.data[1] * 1000;
		retries = e.data[2];
	}else if(e.data[0] == "setTimeout"){
		timeout = e.data[1] * 1000;
	}else if(e.data[0] == "connect"){
		const t = Date.now();
		Connect(e.data[1], e.data[2])
			.then((evt)=>{
				if(evt.target.readyState){
					postMessage([ evt.target.readyState, e.data[2], Date.now() - t ]);
				}
			})
			.catch((err)=>{
				if(err.type == "error")
					postMessage([ err.type, e.data[2], Date.now() - t ]);
				else if(err.type == "timeout")	//	
					postMessage([ err.type, e.data[2], Date.now() - t ]);
				else
					postMessage([ err.type, e.data[2], Date.now() - t ]);
			});
	}
});


/*
	
*/
function Connect(protocol, relay){
	return new Promise(function(resolve, reject) {
		const t = (Date.now() / 1000);
		const ws = new WebSocket(protocol + relay);
		ws.addEventListener("open", function(e){
			if(e.target.readyState){
				ws.send(JSON.stringify([
					"REQ",
					subscription_id,
					{
						"kinds": [ 1 ],	//	0, 1, 4, 5, 6, 7, 9735
						"since": parseInt(t - lapse),
						"until": parseInt(t)
					}
					
				]));
				resolve(e);
			}
		});
		ws.addEventListener("error", function(err){
			reject(err);
		});
		ws.addEventListener("message", function(e){
			const data = JSON.parse(e["data"]);
			switch(data[0]){
				case "AUTH":
					//console.log(data);
					break;
				case "EVENT":
					const diff = t - data[2]["created_at"];
					if(diff < 0)
						this.close(1000);
					else if(diff < lapse){
						if(!this.c)
							this.c = 0;
						this.c++;
					}
					break;
				case "EOSE":
					this.close(1000);
					break;
				case "CLOSED":
					break;
				case "NOTICE":
					console.log(data);
					this.close(1000);
					break;
				default:
					console.log(data);
					this.close(1000);
					break;
			}
		});
		ws.addEventListener("close", function(err){
			if(this.c == undefined)
				this.c = 0;
			postMessage([ "messages", err.target.url.substring(6, err.target.url.length-1), this.c ]);
		});
		//
		if(timeout > 0){
			setTimeout(()=>{
				reject({ type:"timeout" });
				ws.close(1000);
			}, timeout);
		}
	});
}
