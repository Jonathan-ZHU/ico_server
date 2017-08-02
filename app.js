'use strict';

var MobicoinRPC = require('bitcoind-rpc');

var mrpc = new MobicoinRPC({
	protocol:"http",
	host:'120.92.44.149',
	port:8332,
	user:'bitcoin',
	pass:'local321',
});

mrpc.getAccountAddress("",);
