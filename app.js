var RPC = require('bitcoind-rpc');
var express = require("express");
var app = express();
var http = require('http');
var db = require('./db.js');

//本地魔币rpc接口
var mrpc = new RPC({
	protocol:"http",
	host:'127.0.0.1',
	port:'10085',
	user:'mbc',
	pass:'mbc',
});

//本地Tcash的rpc接口
var trpc = new RPC({
	protocol:"http",
	host:'127.0.0.1',
	port:'19938',
	user:'bitcoin',
	pass:'local321',
});


//获取比特币帐号新地址
var getBTCNewAddress = function(callback){
	mrpc.getNewAddress(function (err ,ret){
		if (err) {
			callback(-1,err.message);
			return;
		} else {
			var btcAddr= ret.result;
			console.log("got Bitcoin address: " + btcAddr);
			callback(null,btcAddr);
			return;
		}
	});
}

//验证Tcash地址是否合法
var judgeTcashAddress = function(TcashAddr,callback) {
	trpc.getReceivedByAddress(TcashAddr,0,function (err, ret) {
        		if(err){
			console.log("got a invaild Tcash address");
			callback(null,false);
			return;
		}
		callback(null,true);
		return;
	});
}
	



//1.获取用户需要用来ico的Tcash钱包地址
//2.生成一个比特币的付款地址 将这个地址和Tcash地址一并保存到数据库
//3.返回比特币的付款地址
// app.get('/getBitcoinAddress',function(req,res){
// 	console.log("received Tcash address" + req.query.addr);
// 	//验证Tcash地址是否合法
// 	trpc.getReceivedByAddress(req.query.addr,0,function (err, ret) {
//         		if(err){
// 			var data = {
// 				err:-5,
// 				msg:"Invaild Tcash address"	
// 			};
// 			console.log("got a invaild Tcash address");
// 			res.send(data);
// 			return;
// 		}else{
// 			console.log("distributing Bitcoin address for "+ req.query.addr +" ...");
//         			//生成比特币付款地址
// 			mrpc.getNewAddress(function (err ,ret){
// 				if (err) {
// 					var data = {
// 						err:-4,
// 						msg:err.message,
// 					};
// 					console.log(err);
// 					res.send(data);
// 					return;
// 				} else {
// 					var btcAddr= ret.result;
// 					console.log("got Bitcoin address: " + btcAddr);
// 					//保存到mongodb数据库
// 					var insertData = function(db,callback) {
// 			        		var collection = db.collection('addrs');
// 			        		var data = [{
//                         				'TcashAddr':req.query.addr,
//                         				'BitcoinAddr':btcAddr
//                 				}];
//         					collection.insert(data,function(err, result){
//                 					if(err){
//                         					console.log("ERR:"+err);
//                         					return;
//                 					}
//                 					callback(result);
//         					});
// 					};
// 					mongo.connect(DB_CONN_STR, function(err,db){
// 			      			if(err){
// 							var data = {
// 								err:-3,
// 								msg:err
// 							};
// 							res.send(data);
// 							console.log("DB ERROR!")
// 							return;
// 						}
// 						insertData(db, function(result) {
// 		              				db.close();
// 		              			});
// 			      			console.log("succeeded adding a pair of addresses to db!");
// 			      			console.log('sending back bitcoin address');
//    			      			var data = {
// 			                		err:0,
// 							msg:{btcAddr:btcAddr},	
// 			      			};
// 			      			res.send(data);
// 					});
// 				}
// 			});
// 		}
// 	});		
// });

app.get('/getBitcoinAddress',function(req,res){
	//1.获取用户需要用来ico的Tcash钱包地址
	console.log("received Tcash address" + req.query.addr);
	var revTcashAddr = req.query.addr;
	//2.验证Tcash地址是否合法
	judgeTcashAddress(revTcashAddr,function(err,ret){
		if(err){
			res.send({err:-100,msg:'ERROR!'});
			return;
		}
		if(!ret) {
			res.send({err:-200,msg:'Invaild Tcash address!'});
			return;
		}
		//2.5  验证该地址是否已经存在 存在则不可以再申请新的地址
		db.ifTcashAddrExist(revTcashAddr,function(err,ret){
			if(err){
				res.send({err:-400,msg:'DB ERROR!'});
				return;
			}
			if(ret){
				res.send({err:-500,msg:'This address has been applied'});
				return;
			}
			//3.生成一个比特币的付款地址
			getBTCNewAddress(function(err,ret){
				if(err) {
					res.send({err:-300,msg:ret});
					return;
				}
				var gotBitcoinAddr = ret;
				//4.将这个地址和Tcash地址一并保存到数据库
				db.insertAddressesPair(revTcashAddr,gotBitcoinAddr,function(err,ret){
					if(err){
						res.send({err:-400,msg:'DB ERROR!'});
						return;
					}
					//5.返回比特币的付款地址
					res.send({err:0,msg:gotBitcoinAddr});
					return;
				});
			});
		});
		
	});
});


//获取新地址
//mrpc.getNewAddress(function (err, ret) {
//        console.log(err);
//        console.log(ret);
//        return;
//});

//获取某地址的金币数量
//trpc.getReceivedByAddress("1DaUYPyHJzxeK44FbwR9jPJQ5mZSF3znvz",function (err, ret) {
//        console.log(err);
//        console.log(ret);
//        return;
//});

//http.createServer(function (req , res){
//	res.writeHead(200,{'Content-Type':'text/plain'});
//	res.end('Hello World!\n');
//}).listen(8080);
//console.log("Server is listening on 8080");

//trpc.getReceivedByAddress("1DaUYPyHJzxeK44FbwR9jPJQ5mZSF3znvz",0,function (err, ret) {
//	console.log(err);
//	console.log(ret);	
//
//});

app.listen(8080);
console.log("Listening on port 8080");
