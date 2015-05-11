var twilio = require('twilio');
var accountSid = 'AC35c4885b8ea34af7e3f36efa03f18f0f';
var authToken = "b950959ade49e8d6fa835691bfa1a029";
var client = twilio(accountSid, authToken);
var User = require('../db/User.js');
var PregnancyTextUpdate = require('../db/PregnancyTextUpdate.js');

var mongoose = require('../db/mongoose_connect.js');
var sprintf = require('sprintf-js').sprintf;

var today = new Date();
var day = today.getDay();//timezone is utc - since you're checking every day it's fine but if you werent you'd have to align the timezone to where the user is
console.log("Today is " + day);

var fq = User.where({has_subscribed: true});
fq.find(function(err, users){
	if (err){
		console.log("Error finding users shady man");
	}
	else{
		users.forEach(function(user){
			console.log("User " + user.phone_number + " : " + user.day_to_receive_messages);
		});
	}
});


var query = User.where({day_to_receive_messages: day, has_subscribed: true});
query.find(function(err, users){
	if (err){
		console.log("Error finding users for day " + day);
	}
	else{
		if (users && users.length > 0){

			users.forEach(function(user){
				console.log("Sending message to " + user.phone_number);
				// sendMessage(user.phone_number, "How do you find Will Smith in the snow?\n\n You look for fresh prints.\n\n If you received this let Shady know por favor");
				sendCorrectTextUpdate(user);
			});

		}
		else console.log("No users with day_to_receive_messages equal to " + day);
	}
});

function sendCorrectTextUpdate(user){
	var weekNum = parseInt(user.num_days_pregnant / 7);

	var query = PregnancyTextUpdate.where({week: weekNum});

	query.find(function(err, updates){
		if (err){
			console.log("Error finding ptu for week " + weekNum + " for user " + user.phone_number);
		}
		else{
			if (updates){
				updates.forEach(function(update){
					console.log("sending update.data: " + update.data + " for week " + update.week);
					sendMessage(user.phone_number, update.data);
				});
			}
			else console.log("No ptu for week " + weekNum + " for user " + user.phone_number);
		}
	});

}

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
