var express = require('express');
var router = express.Router();
var twilio = require('twilio');

var mongoose = require('../db/mongoose_connect.js');

// Your accountSid and authToken from twilio.com/user/account
var accountSid = 'AC35c4885b8ea34af7e3f36efa03f18f0f';
var authToken = "b950959ade49e8d6fa835691bfa1a029";
var client = require('twilio')(accountSid, authToken);

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});



router.post('/message', function(req, res){

	console.log(req);

		var phoneNumber = "+13472102276";
		var output = "";

		client.messages.create({
		    to: "+13472102276",
		    from: "+18559561331",
		    body: "Text received."
		}, function(err, responseData) {
			 if (!err) { // "err" is an error received during the request, if any
		        // "responseData" is a JavaScript object containing data received from Twilio.
		        // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
		        // http://www.twilio.com/docs/api/rest/sending-sms#example-1
		        console.log(responseData.from); // outputs "+14506667788"
		        console.log(responseData.body); // outputs "word to your mother."
				output += "Sent to " + phoneNumber + "\n";

		    }
		    else{
		    	console.log(err);
		    	output += "Error";
		    }

		    res.send(output);
		});

	output += "Sending to " + phoneNumber + "\n";

});

router.get('/message', function(req, res){
	console.log(req);

	var phoneNumber = "+13472102276";
		var output = "";

	client.messages.create({
	    to: phoneNumber,
	    from: "+18559561331",
	    body: "\nKnock knock. \n Who's there? \n God \n God who? \n Godzilla."
	}, function(err, responseData) {
		 if (!err) { // "err" is an error received during the request, if any
	        // "responseData" is a JavaScript object containing data received from Twilio.
	        // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
	        // http://www.twilio.com/docs/api/rest/sending-sms#example-1
	        console.log(responseData.from); // outputs "+14506667788"
	        console.log(responseData.body); // outputs "word to your mother."
			output += "Sent to " + phoneNumber;

	    }
	    else{
	    	console.log(err);
	    	output += "Error";

	    }
	    res.send(output);

	});

	output += "Sending to " + phoneNumber + "\n";

});

router.get('/receiveMessage', function(req, res){
		// console.log(req.query.Body);

	var resp = new twilio.TwimlResponse();
	var messageReceived = req.query.Body;
	var body = "No you " + messageReceived.toLowerCase();

	resp.message(body);
	res.send(resp.toString());
	
	// var phoneNumber = "+13472102276";
	// client.messages.create({
	//     to: phoneNumber,
	//     from: "+18559561331",
	//     body: body
	// }, function(err, responseData) {
	// 	 if (!err) { // "err" is an error received during the request, if any
	//         // "responseData" is a JavaScript object containing data received from Twilio.
	//         // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
	//         // http://www.twilio.com/docs/api/rest/sending-sms#example-1
	//         console.log(responseData.from); // outputs "+14506667788"
	//         console.log(responseData.body); // outputs "word to your mother."
	// 		// output += "Sent to " + phoneNumber;

	//     }
	//     else{
	//     	console.log(err);
	//     	// output += "Error";

	//     }
	//     // res.send(output);

	// });


	console.log(resp.toString());
});


router.get('/app', function(req, res){ 


});
module.exports = router;
