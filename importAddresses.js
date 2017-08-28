const db = require('./db.js');
const fs = require('fs');

// fs.readFile('./BitcoinAddresses.txt','utf8', (err, data) => {
//   if (err) throw err;
//   data = data.split("\n");
//
// });



// var data = [
//   {'addr':"Jn59EgNCssRYp7EPRyy4rp8mfnj1EpL15Z"},
//   {'addr':"Jn59EgNCssRYp7EPRyy4rp8mfnj1EpL15Z"},
//   {'addr':"Jn59EgNCssRYp7EPRyy4rp8mfnj1EpL15Z"},
// ];
//
//
//
// db.importBitcoinAddresses(data,function(err,ret){
//   if(err){
//     console.log(ret);
//     return;
//   }
//   console.log(ret);
//
// });
db.clearBitcoinAddresses(function(err,ret){
  console.log(ret);
});
var main = function () {
  //1.读取所有地址
  fs.readFile('./BitcoinAddresses.txt','utf8', (err, data) => {
    if (err) throw err;
    data = data.split("\n");
    //2.组合成数据库json
    var datajson = [];
    for(var i = 0 ; i < data.length ; i ++) {
      if(!data[i]) continue;
      var arr = {"addr":data[i],"index":i};
      datajson.push(arr);
    }
    //3.清空所有数据
    db.clearBitcoinAddresses(function(err,ret){
      if(err) throw ret;
      db.importBitcoinAddresses(datajson,function(err,ret){
        if(err) throw ret;
        console.log(ret);
      });
    });
  });
}();
