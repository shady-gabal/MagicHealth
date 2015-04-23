var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;

var userSchema = new Schema({
	phone_number: {type : String, required: true},
	first_name: {type: String},
	last_name : {type: String},
	has_subscribed: {type: Boolean, default: false},
	subscribe_step : {type: Number, default: 0},
	pregnant : {type: Boolean, default: false},
	date_created: {type: Date, default: Date.now()},
	last_time_messaged: {type: Date, default: Date.now()}
});

module.exports = mongoose.model('User', userSchema);