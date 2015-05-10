var twilio = require('twilio');
var accountSid = 'AC35c4885b8ea34af7e3f36efa03f18f0f';
var authToken = "b950959ade49e8d6fa835691bfa1a029";
var client = twilio(accountSid, authToken);
var User = require('../db/User.js');
var mongoose = require('../db/mongoose_connect.js');


console.log("WORKING...");


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
