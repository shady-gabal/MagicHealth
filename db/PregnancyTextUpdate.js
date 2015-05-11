var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;

var ptuSchema = new Schema({
	data: {type : String, required: true},
	week : {type: Number, default: 1},
	date_created: {type: Date, default: Date.now()},
});


module.exports = mongoose.model('PregnancyTextUpdate', ptuSchema);