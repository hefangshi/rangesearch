var mysql=require('mysql');
var async=require('async');
var poiGen=require('./poiGen.js');

var db_options = {  
    host: 'localhost',  
    port: 3306,  
    user: 'root',  
    password: '',  
    database: 'test' 
};  
var client=mysql.createConnection(db_options);
client.on('error',function(){

})
var gen=new poiGen(client);
var count=process.argv[2]||100;
count=parseInt(count,10);
if (isNaN(count)||count<0)
	count=0;
var type=process.argv[3] || 'parallel'
switch (type){
	case 'queue':
		insertByQueue(client,count);
		break;
	case 'series':
		insertBySeries(client,count);
		break;
	case 'parallel':
		insertByParallel(client,count);
		break;
	default:
		insertByParallel(client,count);
		break;
}

function taskGen(){
	var taskList=[];
	var nowTime=new Date();
	console.log('task gen start:'+count)
	for (var i = 0; i < count; i++) {
		taskList.push(gen.createPoiGenTask());
	};
	console.log('task gen end');
	console.log('task gen time:'+(new Date()-nowTime));
	return taskList;
}

//队列形式，速度最慢
function insertByQueue(client,count){
	var nowTime=new Date();
	console.log('mission start, insertByQueue');
	var taskList=[];
	console.log('task gen start:'+count)
	for (var i = 0; i < count; i++) {
		taskList.push(gen.genData());
	};
	console.log('task gen end');
	console.log('task gen time:'+(new Date()-nowTime));
	console.log('insert start:'+count);
	client.query('START TRANSACTION');
	var queue = async.queue(function(task,callback){
		gen.insertData(task,callback);
	}, 100);
	queue.drain = function() {
	    console.log('insert end');
		console.log('insert time:'+ (new Date()-nowTime));
		client.query('COMMIT');
		client.end();
	}
	queue.push(taskList);
}

//顺序执行
function insertBySeries(client,count){
	var nowTime=new Date();
	console.log('mission start, insertBySeries');
	var taskList=taskGen();
	client.query('START TRANSACTION');
	async.series(taskList,function(err, results){
		console.log('insert end');
		console.log('insert time:'+ (new Date()-nowTime));
		client.query('COMMIT');
		client.end();
	});
}

//并行执行，速度最快...
function insertByParallel(client,count){
	var nowTime=new Date();
	console.log('mission start, insertByParallel');
	var taskList=taskGen();
	console.log('insert start:'+count);
	client.query('START TRANSACTION');
	async.parallel(taskList,function(err, results){
		console.log('insert end');
		console.log('insert time:'+ (new Date()-nowTime));
		client.query('COMMIT');
		client.end();
	});
}


