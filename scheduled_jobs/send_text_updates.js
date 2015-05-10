var twilio = require('twilio');
var accountSid = 'AC35c4885b8ea34af7e3f36efa03f18f0f';
var authToken = "b950959ade49e8d6fa835691bfa1a029";
var client = twilio(accountSid, authToken);
var User = require('../db/User.js');
var mongoose = require('../db/mongoose_connect.js');
var sprintf = require('sprintf-js').sprintf;

var today = new Date();
var day = today.getDay();
console.log("Today is " + day);

var fq = User.where({});
fq.find(function(err, users){
	if (err){
		console.log("Error finding users shady man");
	}
	else{
		for (var user in users){
			console.log(sprintf("User %s: %d", user.phone_number, user.day_to_receive_messages));
		}
	}
});


var query = User.where({day_to_receive_messages: day});
query.find(function(err, users){
	if (err){
		console.log("Error finding users for day " + day);
	}
	else{
		if (users){
			for (var user in users){
				console.log("Sending message to " + user.phone_number);
				sendMessage(user.phone_number, "How do you find Will Smith in the snow?\n\n You look for fresh prints.\n\n If you received this text Shady");
			}
		}
		else console.log("No users with day_to_receive_messages equal to " + day);
	}
});


function sendMessage(phoneNumber, body){
	client.messages.create({
			    to: phoneNumber,
			    from: "+18559561331",
			    body: body,
			}, function(err, responseData) {
				 if (!err) { // "err" is an error received during the request, if any
			        // "responseData" is a JavaScript object containing data received from Twilio.
			        // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
			        // http://www.twilio.com/docs/api/rest/sending-sms#example-1
			        console.log(responseData.from); // outputs "+14506667788"
			        console.log(responseData.body); // outputs "word to your mother."
			    }
			    else{
			    	console.log(err);
			    }
			    // res.send(output);
			});
}
