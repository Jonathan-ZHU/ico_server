var RPC = require('bitcoind-rpc');
var express = require("express");
var app = express();
var http = require('http');
var db = require('./db.js');
var fs = require('fs');
var path = require('path');

/*Params*/
var ICO_LIMIT = 1; // at least this number of bitcoin for ico
var EXCHANGE_RATE = 100; //1 bitcoin for 100 Tcash

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


//打印log
var printLog = function(data){
	var time = new Date();
	var logstr = "[ " + time + " ] " + data + "\n";
	fs.appendFile("./debug.log",logstr,null,function(err){
		console.log(logstr);
	});
}

//打印ERR
var printErr = function (data){
	printLog("ERROR! "+data);
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

//验证Tcash地址是否合法
var judgeTcashAddress = function(TcashAddr,callback) {
	trpc.getReceivedByAddress(TcashAddr,0,function (err, ret) {
        		if(err){
			callback(null,false);
			return;
		}
		callback(null,true);
		return;
	});
};

//获取比特币某地址的金币数量
var getBitcoinAddressRecieved = function (BitcoinAddr,callback) {
	mrpc.getReceivedByAddress(BitcoinAddr,function (err, ret) {
		if(err) {
			callback(err.code,err.message);
			return;
		}
		var balance = ret.result;
	      	callback(null,balance);
	      	 return;
	});
};


//向Tcash地址发送TCC
// { result: '3c6fe33169dd7d9f6babcb2f030a00ff32328f3451fa626c749e5e56572c8cd4',
//   error: null,
//   id: 47972 }
//{ code: -5, message: 'Invalid Bitcoin address' }
var sendToTcashAddr = function (TcashAddr,Num,callback) {
	trpc.sendToAddress(TcashAddr,Num,function (err, ret) {
		if(err) {
			callback(err.code,err.message);
			return;
		}
		callback(null,ret.result);
		return;
	});
}

	
//创建ICO钱包时获取比特币地址
//req:获取用户需要用来ico的Tcash钱包地址
//res:返回比特币的付款地址
app.get('/getBitcoinAddress',function(req,res){
	//1.获取用户需要用来ico的Tcash钱包地址
	printLog("Tcash address " +req.query.addr+ " start getting Bitcoin address for ICO...");
	var revTcashAddr = req.query.addr;
	//2.验证Tcash地址是否合法
	printLog("Tcash address " +req.query.addr+ " checking if address is legal...");
	judgeTcashAddress(revTcashAddr,function(err,ret){
		if(err){
			res.send({err:err,msg:ret});
			return;
		}
		if(!ret) {
			printLog("Tcash address " + req.query.addr + "is invaild, PROCESS STOPPED!");
			res.send({err:-200,msg:'Invaild Tcash address!'});
			return;
		}
		printLog("Tcash address " + req.query.addr + " is proper, checking if this address has been applied...");
		//2.5  验证该地址是否已经存在 存在则不可以再申请新的地址
		db.ifTcashAddrExist(revTcashAddr,function(err,ret){
			if(err){
				printErr("Tcash address " + req.query.addr + "meet DB ERR when verifying if this address is exist, PROCESS STOPPED!");
				res.send({err:-400,msg:'DB ERROR!'});
				return;
			}
			if(ret){
				printLog("Tcash address " + req.query.addr + "has been applied, PROCESS STOPPED!");
				res.send({err:-500,msg:'This address has been applied'});
				return;
			}
			printLog("Tcash address " + req.query.addr + "is not applied, created new ico Tcash address, getting new bitcoin address for it...");
			//3.生成一个比特币的付款地址
			getBTCNewAddress(function(err,ret){
				if(err) {
					printErr("Tcash address " + req.query.addr + "meet RPC ERR when getting it's bitcoin address, PROCESS STOPPED!");
					res.send({err:-300,msg:ret});
					return;
				}
				var gotBitcoinAddr = ret;
				printLog("Tcash address " + req.query.addr + " got it's bitcoin address " + gotBitcoinAddr + " saving two addresses as an ico...");
				//4.将这个地址和Tcash地址一并保存到数据库
				db.insertAddressesPair(revTcashAddr,gotBitcoinAddr,function(err,ret){
					if(err){
						printErr("Tcash address " + req.query.addr + "meet DB ERR when saving as an ico, PROCESS STOPPED!");
						res.send({err:-400,msg:'DB ERROR!'});
						return;
					}
					printLog("Tcash address "+ req.query.addr +" apply ico succeed! returning bitcoin address " + gotBitcoinAddr);
					//5.返回比特币的付款地址
					res.send({err:0,msg:gotBitcoinAddr});
					return;
				});
			});
		});
		
	});
});

//查询某钱包地址对应的比特币地址
app.get('/checkBitcoinAddrByTcashAddr',function(req,res){

});

//用户向比特币地址充值以后，使用该接口验证并索要相应的Tcash
app.get('/icoVerify',function(req,res){
	printLog("Tcash address " + req.query.addr + " start requiring Tcash for ICO...");
	//1.获取Tcash地址
	var revTcashAddr = req.query.addr;
	printLog("Tcash address " + req.query.addr + " checking if db has only one Bitcoin address for Tcash address...");
	//2.查看是否只对应一个bitcoin地址，如果有多个则返回错误
	db.checkPairOfAddrsNum(revTcashAddr,function(err,ret){
		if (err) {
			printErr("Tcash address " + req.query.addr + "meet DB ERR when checking if db has only one Bitcoin address, PROCESS STOPPED");
			res.send({err:-400,msg:'DB ERROR!'});
			return;
		}
		if(ret<1){
			printLog("Tcash address " + req.query.addr + " has not been setup for ICO yet, PROCESS STOPPED");
			res.send({err:-600,msg:'Invaild ICO Tcash Address,please setup ICO address first'});
			return;
		}
		if(ret>1){
			printLog("Tcash address " + req.query.addr + " has more than one bitcoin address, PROCESS STOPPED");
			res.send({err:-700,msg:'We have more than one records, please contact the vendor to solve this problem'});
			return;
		}
		printLog("Tcash address " + req.query.addr + " has one record in db, check if completed ICO...");
		//2.5  查看是否已经完成过ico
		db.ifIcod(revTcashAddr,function(err,ret){
			if(err) {
				printErr("Tcash address " + req.query.addr + "meet DB ERR when checking if completed ICO, PROCESS STOPPED");
				res.send({err:-400,msg:'DB ERROR!'});
				return;
			}
			if(!ret){
				printLog("Tcash address " + req.query.addr + " has processed ICO, PROCESS STOPPED");
				res.send({err:-800,msg:'This address has processed ICO, please don\'t try again!'});
				return;
			}
			var gotBitcoinAddr = ret;
			printLog("Tcash address " + req.query.addr + " has not completed ICO, check the balance of the bitcoin address...");
			//3.查询改bitcoin地址的余额,余额没有达到要求则返回错误
			getBitcoinAddressRecieved(gotBitcoinAddr,function(err,ret){
				if(err) {
					printErr("Tcash address " + req.query.addr + "meet RPC ERR when checking the balance of the bitcoin address, PROCESS STOPPED");
					res.send({err:-200,msg:err.message});
					return;
				}
				if(ret<=ICO_LIMIT) {
					printLog("Tcash address " + req.query.addr + "\'s bitcoin address has not enough balance, PROCESS STOPPED");
					res.send({err:-900,msg:'Not enought balance in your account! Send enough bitcoin to the address and try again'});
					return;
				}
				//计算兑换比例
				var ecgTcash = ret * EXCHANGE_RATE;
				printLog("Tcash address " + req.query.addr + " has "+ ret +" BTC for  ICO, transacting " +  ecgTcash + " TCC to the address...");
				//4.向Tcash地址打款
				sendToTcashAddr(revTcashAddr,ecgTcash,function(err,ret){
					if(err) {
						printErr("Tcash address " + req.query.addr + "meet RPC ERR when transacting tcash, PROCESS STOPPED");
						res.send({err:-200,msg:err});
						return;
					}
					var transactionHash = ret;
					printLog("Tcash address " + req.query.addr + " has received "+  ecgTcash +" TCC, marking this ICO completed...");
					//5.将改ico地址标记为已完成
					db.completeICO(gotBitcoinAddr,function(err,ret){
						if(err) {
							printErr("Tcash address " + req.query.addr + "meet DB ERR when marking this ICO completed, PROCESS STOPPED");
							res.send({err:-400,msg:'DB ERROR!'});
							return;
						}
						printLog("Tcash address "+ req.query.addr +" ICO completed! Returning transaction hash");
						//6.ICO已成功，返回交易单号
						res.send({err:0,msg:transactionHash});
					});
				});
			});
		});
	});
});

//

//获取新地址
//mrpc.getNewAddress(function (err, ret) {
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
