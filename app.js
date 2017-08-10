var RPC = require('bitcoind-rpc');
var express = require("express");
var app = express();
var http = require('http');
var mongo = require('mongodb').MongoClient;
var DB_CONN_STR = 'mongodb://localhost:27017/ico_addresses';

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

//1.获取用户需要用来ico的Tcash钱包地址
//2.生成一个比特币的付款地址 将这个地址和Tcash地址一并保存到数据库
//3.返回比特币的付款地址
app.get('/getBitcoinAddress',function(req,res){
	console.log("received Tcash address" + req.query.addr);
	//TODO:验证Tcash地址是否合法
	console.log("distributing Bitcoin address for "+ req.query.addr +" ...");
        //生成比特币付款地址
	mrpc.getAccountAddress('',function (err ,ret){
		if (err) {
			console.log(err);
			return;
		} else {
			var btcAddr= ret.result;
			console.log("got Bitcoin address: " + btcAddr);
			//保存到mongodb数据库
			var insertData = function(db,callback) {
			        var collection = db.collection('addrs');
			        var data = [{
                        		'TcashAddr':req.query.addr,
                        		'BitcoinAddr':btcAddr
                		}];
        			collection.insert(data,function(err, result){
                			if(err){
                        			console.log("ERR:"+err);
                        			return;
                			}
                			callback(result);
        			});
			};
			mongo.connect(DB_CONN_STR, function(err,db){
			      insertData(db, function(result) {
			      		console.log(result);
		              		db.close();
		              });
			      console.log("succeeded adding a pair of addresses to db!");
			      console.log('sending back bitcoin address');
   			      var data = {
			                err:0,
					msg:{btcAddr:btcAddr},	
			      };
			      res.send(data);
			});
		}
	});
	
});

//获取新地址
//mrpc.getNewAddress(function (err, ret) {
//        console.log(err);
//        console.log(ret);
//        return;
//});

//获取某地址的金币数量
//trpc.getReceivedByAddress("Jf5HyhCX3XFVshHAX7rGrtqCaHYuntchHb",function (err, ret) {
        //console.log(err);
        //console.log(ret);
        //return;
//});

//http.createServer(function (req , res){
//	res.writeHead(200,{'Content-Type':'text/plain'});
//	res.end('Hello World!\n');
//}).listen(8080);
//console.log("Server is listening on 8080");

app.listen(8080);
console.log("Listening on port 8080");
