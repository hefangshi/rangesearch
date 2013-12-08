module.exports = poiGen;
var geohash=require('ngeohash')
function poiGen(client){
	this.client=client;
}

poiGen.prototype._randomValue = function(from,to) {
	if (from>to){
		var tmp=from;
		from=to;
		to=tmp;
	}
	return Math.random()*(to-from)+from;
};

poiGen.prototype._randomWord = function() {    //from 97 to 122
    var length=Math.random()*5+4;
    var word=[];
    for (var i = 0; i < length; i++) {
        var _char=String.fromCharCode(Math.random()*25+97);
        word.push(_char);
    }
    return word.join('');
};
poiGen.prototype.createPoiGenTask=function(){
	var data=this.genData();
	var _this=this;
	var task=function(callback){
		_this.insertData(data,callback)
	}
	return task;
}
poiGen.prototype.genData=function(){
/*	var coordEdge={
		topLeftX:12937872.97,
		topLeftY:4840787.72,
		rightBottomX:12980240.97,
		rightBottomY:4806867.72
	};*/
	var coordEdge={
		topLeftX:31.138,
		topLeftY:121.441,
		rightBottomX:31.238,
		rightBottomY:121.5
	};
	var x=this._randomValue(coordEdge.topLeftX,coordEdge.rightBottomX);
	var y=this._randomValue(coordEdge.topLeftY,coordEdge.rightBottomY);
	var name=this._randomWord();
	return {
		name:name,
		x:x,
		y:y,
		hash:geohash.encode(x,y)
	}
}
poiGen.prototype.insertData=function(task,callback){
	this.client.query("insert into pois set name=?,lat=?,lon=?,geo=GeomFromText('POINT(? ?)'),hash=?",
		[task.name,task.x,task.y,task.x,task.y,task.hash],function(err){
		callback();
	});
}