var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;

var vtuSchema = new Schema({
	data: {type : String, required: true},
	month : {type: Number, default: 0},
	date_created: {type: Date, default: Date.now()},
});


module.exports = mongoose.model('VaccineTextUpdate', vtuSchema);