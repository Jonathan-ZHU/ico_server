var MobicoinRPC = require('bitcoind-rpc');
var express = require("express");
var app = express();

var mongo = require('mongodb').MongoClient;
var DB_CONN_STR = 'mongodb://localhost:27017/ico_addresses';

var insertData = function(db,callback) {
	var collection = db.collection('site');
	var data = [
		{
			'TcashAddr':"dkjflkasjoicjzlfjlkaksdjfsjlajfdkas",
			'BitcoinAddr':"fjddkslaldkjfkdsajflkdsjalfkjsldad"
		},{
			'TcashAddr':'fdjksaldkfjldsajdkfldsjaflfdasfdsa',
			'BitcoinAddr':'fjdklsakdfjlkxzcjkwaeradfddsajfdka'
		}

	];
	collection.insert(data,function(err, result){
		if(err){
			console.log("ERR:"+err);
			return;
		}
		callback(result);
	});
};

mongo.connect(DB_CONN_STR, function(err,db){
	console.log("连接成功！");
    	insertData(db, function(result) {
        	console.log(result);
        	db.close();
    	});
});

var mrpc = new MobicoinRPC({
	protocol:"http",
	host:'127.0.0.1',
	port:'8332',
	user:'bitcoin',
	pass:'local321',
});

mrpc.getAccountAddress("",function (err, ret) {
	console.log(err);
	console.log(ret);
	return;
});

//获取新地址
mrpc.getNewAddress(function (err, ret) {
        console.log(err);
        console.log(ret);
        return;
});

//获取某地址的金币数量
mrpc.getReceivedByAddress("Jf5HyhCX3XFVshHAX7rGrtqCaHYuntchHb",function (err, ret) {
        console.log(err);
        console.log(ret);
        return;
});

//http.createServer(function (req , res){
//	res.writeHead(200,{'Content-Type':'text/plain'});
//	res.end('Hello World!\n');
//}).listen(8080);
//console.log("Server is listening on 8080");
console.log("getBtcAddrByIcoCoinAddr");
app.get('/getBtcAddrByIcoCoinAddr',function(req,res){
	console.log(req.query.addr);
	res.send("few79801uifuhisaufdhlisaduhfduoaidcoa");
});

app.listen(8080);
console.log("Listening on port 8080");
