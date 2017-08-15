var mongo = require('mongodb').MongoClient;

var DB_CONN_STR = 'mongodb://localhost:27017/ico_addresses';

// 保存一一对应的一对地址(Tcash & Bitcoin)
exports.insertAddressesPair = function (TcashAddr,BitcoinAddr,callback) {
	var insertData = function(db,callback) {
        		var collection = db.collection('addrs');
        		var data = [{
            			'TcashAddr':TcashAddr,
            			'BitcoinAddr':BitcoinAddr,
            			'icod':0
    		}];
		collection.insert(data,function(err, result){
        			if(err){
                				console.log("ERR:"+err);
                				callback(result);
                				return;
        			}
    			callback(result);
		});
	};
	mongo.connect(DB_CONN_STR, function(err,db){
	  	if(err){
			var data = {
				err:-3,
				msg:err
			};
			callback(err,err);
			console.log("DB ERROR!")
			return;
		}
		insertData(db, function(result) {
	      		db.close();
	      	});
	  	console.log("succeeded adding a pair of addresses to db!");
	  	console.log('sending back bitcoin address');
	  	callback(null,"ok");
	  	return;
	});
}

//验证Tcash地址是否已经存在
exports.ifTcashAddrExist = function(TcashAddr,callback) {
	var findData = function(db,callback) {
        		var collection = db.collection('addrs');
        		var data = {
            			'TcashAddr':TcashAddr,
    		};
		collection.find(data).toArray(function( , result){
        			if(err){
                				callback(result);
                				return;
        			}
    			callback(result);
		});
	};
	mongo.connect(DB_CONN_STR, function(err,db){
	  	if(err){
			callback(err,err);
			return;
		}
		findData(db, function(result) {
	      		db.close();
			if(result.length>0) {
	      			callback(null,true);
	      			return;
	      		}
	      		callback(null,false);
	      	});
	  	
	  	return;
	});
}

//查询某Tcash地址对应多少个bitcoin地址
exports.checkPairOfAddrsNum = function(TcashAddr,callback){
	var findData = function(db,callback) {
        		var collection = db.collection('addrs');
        		var data = {
            			'TcashAddr':TcashAddr,
    		};
		collection.find(data).toArray(function(err, result){
        			if(err){
                				callback(result);
                				return;
        			}
    			callback(result);
		});
	};
	mongo.connect(DB_CONN_STR, function(err,db){
	  	if(err){
			callback(err,err);
			return;
		}
		findData(db, function(result) {
	      		db.close();
	      		callback(null,result.length);
	      	});	  	
	  	return;
	});
}

//查看是否已经完成过ico,已完成返回null，wei完成过返回对应的bitcoin地址
exports.ifIcod = function(TcashAddr,callback){
	var findData = function(db,callback) {
        		var collection = db.collection('addrs');
        		var data = {
            			'TcashAddr':TcashAddr,
    		};
		collection.find(data).toArray(function(err, result){
        			if(err){
                				callback(result);
                				return;
        			}
    			callback(result);
		});
	};
	mongo.connect(DB_CONN_STR, function(err,db){
	  	if(err){
			callback(err,err);
			return;
		}
		findData(db, function(result) {
	      		db.close();
	      		var res = result[0];
	      		var BitcoinAddr = res.BitcoinAddr;
	      		var icod = res.icod;
	      		if(icod==0){
	      			callback(null,BitcoinAddr);
	      		} else {
	      			callback(null,null);
	      		}
	      	});	  	
	  	return;
	});
}


//将改ico地址标记为已完成
exports.completeICO = function(BitcoinAddr,callback){
	var update = function(db,callback) {
        		var collection = db.collection('addrs');
        		var data = {
            			'BitcoinAddr':BitcoinAddr,
    		};
    		collection.update(data, {$set: {icod:1}},function(err, result){
        			if(err){
                				callback(result);
                				return;
        			}
    			callback(result);
		});
	};
	mongo.connect(DB_CONN_STR, function(err,db){
	  	if(err){
			callback(err,err);
			return;
		}
		update(db, function(result) {
	      		db.close();
	      		callback(null,"ok!");
	      	});	  	
	  	return;
	});
}