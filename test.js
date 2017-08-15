var RPC = require('bitcoind-rpc');
var express = require("express");
var app = express();
var http = require('http');
var fs = require('fs');
var path = require('path');


//打印log
var printLog = function(data){
	var time = new Date();
	var logstr = "[ " + time + " ] " + data + "\n";
	fs.appendFile("./test.log",logstr,null,function(err){
		console.log(logstr);
	});
}

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

//获取一个本地Tcash地址
var getTCCNewAddress = function(callback){
	trpc.getNewAddress(function (err ,ret){
		if (err) {
			callback(err.code,err.message);
			return;
		} else {
			var tccAddr= ret.result;
			callback(null,tccAddr);
			return;
		}
	});
}

//获取比特币帐号新地址
var getBTCNewAddress = function(callback){
	mrpc.getNewAddress(function (err ,ret){
		if (err) {
			callback(err.code,err.message);
			return;
		} else {
			var btcAddr= ret.result;
			callback(null,btcAddr);
			return;
		}
	});
}

//用户向比特币地址充值以后，使用该接口验证并索要相应的Tcash
// http.get("http://127.0.0.1:8080/icoVerify?addr=1DamnMLaeUCBE4BcsSUYq", function(res) {
//   	res.setEncoding('utf8');
// 	res.on('data', function (chunk) {
// 	                console.log(chunk);
// 	})
// }).on('error', function(e) {
//   	console.log(e);
// });

//创建ICO钱包时获取比特币地址
// http.get("http://127.0.0.1:8080/getBitcoinAddress?addr=1DamnMLaeUCBE4BcsSUYq", function(res) {
//   	res.setEncoding('utf8');
// 	res.on('data', function (chunk) {
// 	                console.log(chunk);
// 	})
// }).on('error', function(e) {
//   	console.log(e);
// });
var count= [0,0,0,0] ;

var testGetBitcoinAddress = function (num){
	if(num>=2500) return
	//get a tcash address
	getTCCNewAddress(function(err,ret){
		if(err) {
			printLog(ret);
		}
		//创建ICO钱包时获取比特币地址
		http.get("http://127.0.0.1:8080/getBitcoinAddress?addr="+ret, function(res) {
		  	res.setEncoding('utf8');
			res.on('data', function (chunk) {
			                printLog("time is " + num);
			                printLog(chunk);
			})
			testGetBitcoinAddress(++num);
		}).on('error', function(e) {
			printLog("time is " + num);
		  	printLog(e);
			testGetBitcoinAddress(++num);
		});
	});
}

printLog("start testing get bitcoin address...");
testGetBitcoinAddress(count[0]);
testGetBitcoinAddress(count[1]);
testGetBitcoinAddress(count[2]);
testGetBitcoinAddress(count[3]);
