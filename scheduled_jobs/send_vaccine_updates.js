var twilio = require('twilio');
var accountSid = 'AC35c4885b8ea34af7e3f36efa03f18f0f';
var authToken = "b950959ade49e8d6fa835691bfa1a029";
var client = twilio(accountSid, authToken);
var User = require('../db/User.js');
var PregnancyTextUpdate = require('../db/PregnancyTextUpdate.js');
var VaccineTextUpdate = require('../db/VaccineTextUpdate.js');

var mongoose = require('../db/mongoose_connect.js');
var sprintf = require('sprintf-js').sprintf;

var today = new Date();
var day = today.getDay();//timezone is utc - since you're checking every day it's fine but if you werent you'd have to align the timezone to where the user is

console.log("Today is " + day);

// var fq = User.where({has_subscribed: true});

// fq.find(function(err, users){
// 	if (err){
// 		console.log("Error finding users shady man");
// 	}
// 	else{
// 		users.forEach(function(user){
// 			console.log("User " + user.phone_number + " : " + user.day_to_receive_messages);
// 		});
// 	}
// });


var query = User.where({day_to_receive_messages: day, has_subscribed: true, has_child: true});
query.find(function(err, users){
	if (err){
		console.log("Error finding users for day " + day);
	}
	else{
		if (users && users.length > 0){
			users.forEach(function(user){
				console.log("Sending message to " + user.phone_number);
				sendCorrectVaccineUpdate(user);
			});

		}
		else console.log("No users with day_to_receive_messages equal to " + day);
	}
});

function sendCorrectVaccineUpdate(user){
	var monthNum = parseInt(user.num_days_pregnant / 30);

	if (user.finished_vaccines.indexOf(monthNum) == -1){
		var query = VaccineTextUpdate.where({month: monthNum});

		query.find(function(err, updates){
			if (err){
				console.log("Error finding vtu for month " + monthNum + " for user " + user.phone_number);
			}
			else{
				var reminder = "";
				if (user.sent_vaccine_updates.indexOf(monthNum) == -1){
					user.sent_vaccine_updates.push(monthNum);
					user.markModified('sent_vaccine_updates');
				}
				else reminder = "REMINDER - ";

				if (updates){
					updates.forEach(function(update){
						console.log("sending v update.data: " + update.data + " for month " + update.month);
						sendMessage(user.phone_number, reminder + update.data);
					});


				}
				else console.log("No vtu for month " + monthNum + " for user " + user.phone_number);
			}
		});
	}
}

function sendMessage(phoneNumber, body){
	// var arr = chunkSubstr1(body, MAX_TEXT_SIZE);

	// arr.forEach(function(text){
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
	// });

}

// function chunkSubstr1(str, size) {
//   var chunks = new Array(str.length / size + .5 | 0),
//       nChunks = chunks.length;

//   var newo = 0;
//   for(var i = 0, o = 0; i < nChunks; ++i, o = newo) {
//     newo += size;
//     chunks[i] = str.substr(o, size);
//   }

//   return chunks;
// }
