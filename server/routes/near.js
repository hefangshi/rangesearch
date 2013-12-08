
/*
 * GET users listing.
 */
var geohash=require('ngeohash');
var mysql=require('mysql');
var db_options = {  
    host: 'localhost',  
    port: 3306,  
    user: 'root',  
    password: '',  
    database: 'test'
};  
var client=mysql.createConnection(db_options);
client.on('error',function(errs){
	console.dir(errs);
})

exports.list = function(req, res){
    var hashArr=[];
	var distance=req.params.dis||7;
	var hash=geohash.encode(req.query.lat,req.query.lng);
	hash=hash.substring(0,distance);
	var neighborDi=[
        [-1,-1],[0,-1],[1,-1],
        [-1, 0],[1,0],
        [-1,1],[0,1],[1,1]
    ];
    neighborDi.forEach(function(di) {
        var neighborHash=geohash.neighbor(hash,di);
        hashArr.push(neighborHash);
    });
    hashArr.push(hash);
    bboxQuery(req.query.lng,req.query.lat,hashArr,distance,function(ret){
        res.send(ret);
    });
};

exports.step = function(req, res){
    var hashArr=[];
    var distance=req.params.dis||7;
    var step=req.params.step||1;
    var hash=geohash.encode(req.query.lat,req.query.lng);
    hash=hash.substring(0,distance);
    step=parseInt(step,10);
    var from=-(step +1);
    var to=step +1;
    var neighborDi=[];
    for (var i = from; i <= to; i++) {
        if (i==from||i==to){
            for(var j=from;j<=to;j++){
                neighborDi.push([j,i]);
            }
        }else{
            neighborDi.push([from,i]);
            neighborDi.push([to,i]);
        }
    }
    neighborDi.forEach(function(di) {
        var neighborHash=geohash.neighbor(hash,di);
        hashArr.push(neighborHash);
    });
    bboxQuery(req.query.lng,req.query.lat,hashArr,distance,function(ret){
        res.send(ret);
    });
};

function bboxQuery(lng,lat,hashArr,dis,callback){
    var paramArr=[];
    var bboxArr=[];
    var countArr=[];
    var query='select lon,lat,pow((?-lon),2)+pow(?-lat,2) as dis from pois where 1=2 ';
    var countQuery='select count(*) as count from pois where 1=2 ';
    paramArr.push(lng);
    paramArr.push(lat);
    hashArr.forEach(function(hash) {
        var bbox=geohash.decode_bbox(hash);
        bboxArr.push(bbox);
        countArr.push(hash+"%");
        paramArr.push(hash+"%");
        query+='or hash like ? ';
        countQuery+='or hash like ? ';
    });
    query+=' order by dis ';
    query+=' limit 300;';
    var time=new Date();
    client.query(countQuery,countArr,function(err,result){
        var count=result[0].count;
        client.query(query,paramArr,function (err,rows) {
            var ret={
                content:{
                    poi:rows,
                    bbox:bboxArr,
                    count:count
                },
                status:0,
                time:(new Date()-time)
            };
            if (callback)
                callback(ret);
        });
    });
}

