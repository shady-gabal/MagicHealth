var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;

var userSchema = new Schema({
	phone_number: {type : String, required: true},
	first_name: {type: String},
	last_name : {type: String},
	full_name : {type: String},

	last_message_received : {type: String},
	last_message_sent : {type: String},

	has_subscribed: {type: Boolean, default: false},
	subscribe_step : {type: Number, default: 0},

	pregnant : {type: Boolean, default: false},
	num_days_pregnant : {type: Number, default: 0},

	has_child : {type: Boolean, default: false},
	num_days_child: {type: Number, default: 0},
	sent_vaccine_updates: [{type: Number}],
	finished_vaccines : [{type: Number}],

	day_to_receive_messages : {type: Number, default: 0},

	age: {type: Number, default: 0},

	date_created: {type: Date, default: Date.now()},
	last_time_messaged: {type: Date, default: Date.now()}
});

module.exports = mongoose.model('User', userSchema);