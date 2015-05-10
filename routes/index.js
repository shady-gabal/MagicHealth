var express = require('express');
var router = express.Router();
var User = require('../db/User.js');
var sprintf = require('sprintf-js').sprintf;
// var schedule = require('node-schedule');

var mongoose = require('../db/mongoose_connect.js');
// Your accountSid and authToken from twilio.com/user/account
var twilio = require('twilio');
var accountSid = 'AC35c4885b8ea34af7e3f36efa03f18f0f';
var authToken = "b950959ade49e8d6fa835691bfa1a029";
var client = twilio(accountSid, authToken);


/* SCHEDULE TEXTS */

//'0 0 0 * * *'  every day
// var j = schedule.scheduleJob('0 * * * * *', function(){
//     console.log('Checking users for texts to send today...');
//     checkUsersAndSendTexts();
//     // sendMessage('13472102276', 'cron bro');
// });


// function checkUsersAndSendTexts(){
// }

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});


router.get('/reset', function(req, res){
	User.remove({}, function(){
		res.send("Aiiiiiiiiiite"); //delete all users
	});
});

router.get('/resetShady', function(req, res){
	var query = User.where({phone_number: "13472102276"});
	query.findOne(function(err, user){
		if (!err){
			if (user){
				user.has_subscribed = false;
				user.subscribe_step = 10;
				user.save();
				res.send("Reset to day subscribing stage shady ");
			}
			else res.send("No user found");
		}
		else res.send("Error");
	});
});


// router.post('/message', function(req, res){

// 	console.log(req);

// 		var phoneNumber = "+13472102276";
// 		var output = "";

// 		client.messages.create({
// 		    to: "+13472102276",
// 		    from: "+18559561331",
// 		    body: "Text received."
// 		}, function(err, responseData) {
// 			 if (!err) { // "err" is an error received during the request, if any
// 		        // "responseData" is a JavaScript object containing data received from Twilio.
// 		        // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
// 		        // http://www.twilio.com/docs/api/rest/sending-sms#example-1
// 		        console.log(responseData.from); // outputs "+14506667788"
// 		        console.log(responseData.body); // outputs "word to your mother."
// 				output += "Sent to " + phoneNumber + "\n";

// 		    }
// 		    else{
// 		    	console.log(err);
// 		    	output += "Error";
// 		    }

// 		    res.send(output);
// 		});

// 	output += "Sending to " + phoneNumber + "\n";

// });

// router.get('/message', function(req, res){
// 	console.log(req);

// 	var phoneNumber = "+13472102276";
// 		var output = "";

// 	client.messages.create({
// 	    to: phoneNumber,
// 	    from: "+18559561331",
// 	    body: "\nKnock knock. \n Who's there? \n God \n God who? \n Godzilla."
// 	}, function(err, responseData) {
// 		 if (!err) { // "err" is an error received during the request, if any
// 	        // "responseData" is a JavaScript object containing data received from Twilio.
// 	        // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
// 	        // http://www.twilio.com/docs/api/rest/sending-sms#example-1
// 	        console.log(responseData.from); // outputs "+14506667788"
// 	        console.log(responseData.body); // outputs "word to your mother."
// 			output += "Sent to " + phoneNumber;

// 	    }
// 	    else{
// 	    	console.log(err);
// 	    	output += "Error";

// 	    }
// 	    res.send(output);

// 	});

// 	output += "Sending to " + phoneNumber + "\n";

// });

router.get('/sendMessageTo', function(req, res){
	var phoneNumber = req.query.phoneNumber;
	sendMessage(phoneNumber, 'Roses are red\nViolets are blue\nYou fuckin idiot');
});

router.get('/receiveMessage', function(req, res){
		// console.log(req.query.Body);

	var resp = new twilio.TwimlResponse();
	var messageReceived = req.query.Body;

	// console.log(req.query);
	var phoneNumber = req.query.From;
	phoneNumber = phoneNumber.replace("+", "");
	phoneNumber = phoneNumber.trim();

	var body;

	var query = User.where({phone_number: phoneNumber});
	query.findOne(function(err, user){
		if (err){
			console.log("Error fetching account for " + phoneNumber + " : " + err);
			body = "There was an error. Our fault b";
		}
		else{
			if (!user){
				console.log("Creating new account for phone number " + phoneNumber + "...");
				//no current account, subscribe
				var newUser = new User({
					phone_number : phoneNumber,
					last_message_received: messageReceived
				});
				newUser.save();
				receiveSubscribe(newUser, res, resp, messageReceived);
			}
			else{
				user.last_message_received = messageReceived;
				console.log("Retrieved account for phone number " + phoneNumber);

				// if (!user.has_subscribed){
					receiveSubscribe(user, res, resp, messageReceived);
				// }
				// else{
				// 	body = "Thank you for subscribing.";
				// }
			}
		}


		if (body){
			sendMessageResp(resp, res, body, user);
		}
	});	


	console.log(resp.toString());
});


function sendSubscribe(user, res, resp, existingBody){
	var index = user.subscribe_step;
	var body = "";

	if (existingBody)
		body = existingBody + " ";

	switch(index){
		// case -1: //Welcome to MagicHealth. To subscribe, please text us 'subscribe'
		// body = "Welcome to MagicHealth. To subscribe, please text us 'subscribe'."
		// break;

		case -1: //dont answer
		return;
		break;

		case 0: //
		body += "Welcome to MagicHealth. To subscribe, please text us 'subscribe'."
		break;

		case 1: //What is your name?
		body += "Thank you for being interested in MagicHealth. What is your name?"
		break;

		case 2://Hi %s. How old are you?
		body += "Hi " + user.first_name + ". How old are you?";
		break;

		case 3: //Are you pregnant currently?
		body += "Are you pregnant currently?"
		break;

		case 4: //How long have you been pregnant?
		body += "How long have you been pregnant, " + user.first_name + "? (example: 6 weeks, or 7 months, or 10 days)"
		break;

		case 6: //Do you have a child that is under 2 years old?
		body += "Do you have a child that is under 2 years old?"
		break;

		case 7: //How old is your child?
		body += "How old is your child? (example: 6 weeks, or 7 months, or 10 days)"
		break;

		case 10: //“What day of the week would you like to receive messages from us?”
		body += "What day of the week would you like to receive messages from us?"
		break;

		case 11: //“At what time during the day would you like to receive messages from us?
		body += "At what time during the day would you like to receive messages from us?"
		break;

		case 31:
		body += "Thanks for subscribing " + user.first_name + "! We will start messaging you soon with helpful tips on ";
		var pred = user.pregnant ? "having a healthy pregnancy." : "raising a healthy child.";
		body += pred;
		user.subscribe_step = -1;
		user.has_subscribed = true;
		user.save();
		break;

		//errors
		case 13:
		body += "Sorry, MagicHealth is only for women who are pregnant or who have a child under 2 years of age. If you'd like to reset, text us 'subscribe'.";
		user.subscribe_step = -1;
		user.save();
		break;

		default: //already subscribed. Resubscribe
		body += "Our records show that you're already subscribed. If this is an error or you'd like to resubscribe, just text us 'subscribe'.";
		break;
	}

	sendMessageResp(resp, res, body, user);
}


function receiveSubscribe(user, res, resp, messageReceived){
	console.log(sprintf("Subscribing %s...", user.phone_number));

	var index = user.subscribe_step;
	var sendDidntUnderstand = false;
	var didntUnderstand = "Sorry, we couldn't understand that.";

	messageReceived = messageReceived.trim().toLowerCase();
	if (!messageReceived){
		sendDidntUnderstand = true;
	}
	else if (messageReceived === 'subscribe' && user.subscribe_step != 0){
		user.subscribe_step = 1;
		user.has_subscribed = false;
		user.save();
		didntUnderstand = "Resetting subscribing process.";
		sendDidntUnderstand = true;
	}

	else if(!user.has_subscribed){

		switch (index){
			case 0: //Welcome to MagicHealth. To subscribe, please text us 'subscribe'
			if (messageReceived === 'subscribe'){
				user.subscribe_step = 1;
				user.save();
			}
			else{
				if (user.last_message_sent){//send didnt understand
					sendDidntUnderstand = true;
				}
			}
			break;

			case 1: //What is your name?
			messageReceived = "         " + messageReceived + "        ";
			messageReceived = messageReceived.replace(" my name is ", " ");
			messageReceived = messageReceived.replace(" i'm ", " ");
			messageReceived = messageReceived.replace(" i am ", " ");
			messageReceived = messageReceived.replace(" it is ", " ");
			messageReceived = messageReceived.replace(" it's ", " ");
			messageReceived = messageReceived.trim();
			console.log(messageReceived);

			var names = messageReceived.split(" ");
			if (!names || names.length < 1 || names[0].length < 1){
				sendDidntUnderstand = true;
			}
			else{
				user.first_name = names[0].charAt(0).toUpperCase() + names[0].substring(1);
				user.last_name = names[names.length - 1].charAt(0).toUpperCase() + names[names.length - 1].substring(1);
				user.full_name = messageReceived;
				user.subscribe_step = 2;
				user.save();
			}
			break;

			case 2://Hi %s. How old are you?

			var age = getNumFromString(messageReceived);

			if (!age){
				didntUnderstand = "That is not a valid age.";
				sendDidntUnderstand = true;
			}
			else{
				user.age = age;
				user.save();
				user.subscribe_step = 3;
				didntUnderstand = "Okay."; //little hack but it works
				sendDidntUnderstand = true;
			}
			break;

			case 3: //Are you pregnant currently?
			if (messageReceived.indexOf('yes') != -1 || messageReceived.indexOf('yea') != -1 || messageReceived.indexOf('yeah') != -1){
				user.pregnant = true;
				user.subscribe_step = 4;
				user.save();
			}
			else if (messageReceived.indexOf('no') != -1){
				user.pregnant = false;
				user.subscribe_step = 6;
				user.save();
			}
			else{
				didntUnderstand = "We didn't understand that. Please answer yes or no.";
				sendDidntUnderstand = true;
			}
			break;

			case 4: //How long have you been pregnant?

			var num = getNumFromString(messageReceived);
	 		var days;

	 		if (!num){
	 			didntUnderstand = "We didn't understand that. Please answer in either days, weeks, or months,and write out the numbers instead of spelling them (example: use 2, not two).";
				sendDidntUnderstand = true;
	 		}

			else if (messageReceived.indexOf('day') != -1){
				days = num;
			}
			else if (messageReceived.indexOf('week') != -1){
				days = num * 7;
			}

			else if (messageReceived.indexOf('month') != -1){
				days = num * 30;
			}

			if (days){
				if (days > 364){
					didntUnderstand = "Pretty sure that's impossible. Please make sure you entered the right amount of time.";
					sendDidntUnderstand = true;
				}
				else{
					user.num_days_pregnant = days;
					user.subscribe_step = 10;
					user.save();
				}
			}
			else{
				didntUnderstand = "We didn't understand that. Please answer in either days, weeks, or months.";
				sendDidntUnderstand = true;
			}
			break;

			case 6: //Do you have a child that is under 2 years old?
			if (messageReceived.indexOf('yes') != -1 || messageReceived.indexOf('yea') != -1 || messageReceived.indexOf('yeah') != -1){
				user.has_child = true;
				user.subscribe_step = 7;
				user.save();
			}
			else if (messageReceived.indexOf('no') != -1){
				user.has_child = false;
				user.subscribe_step = 13;
				user.save();
			}
			else{
				didntUnderstand = "We didn't understand that. Please answer yes or no.";
				sendDidntUnderstand = true;
			}
			break;






			case 7: //How old is your child?
			var num = getNumFromString(messageReceived);
	 		var days;

	 		if (!num){
	 			didntUnderstand = "We didn't understand that. Please answer in either days, weeks, or months.";
				sendDidntUnderstand = true;
	 		}

			else if (messageReceived.indexOf('day') != -1){
				days = num;
			}
			else if (messageReceived.indexOf('week') != -1){
				days = num * 7;
			}

			else if (messageReceived.indexOf('month') != -1){
				days = num * 30;
			}

			if (days){
				user.num_days_child = days;
				user.subscribe_step = 10;
				user.save();
			}
			else{
				didntUnderstand = "We didn't understand that. Please answer in either days, weeks, or months, and write out the numbers instead of spelling them (example: use 2, not two).";
				sendDidntUnderstand = true;
			}
			break;




			case 10: //“What day of the week would you like to receive messages from us?”
			var day = messageReceived;
			var days = ["sun", "sunday", "mon", "monday", "tues", "tuesday", "wed", "wednesday", "thurs", "thursday", "fri", "friday", "sat", "saturday"];
			var index = days.indexOf(day);
			if (index == -1 || isNaN(index)){
				didntUnderstand = "Sorry, we didn't understand that. Please enter any day from Monday - Sunday.";
				sendDidntUnderstand = true;

			}
			else{
				console.log("Day is " + day);
				day /= 2;
				var intDay = parseInt(day);
				console.log("intDay is " + intDay);
				user.day_to_receive_messages=  intDay;
				user.subscribe_step = 31;
				user.save();	
			}

			break;

			// case 11: //“At what time during the day would you like to receive messages from us?
			// var time = messageReceived;
			// user.time_to_receive_messages=  1;
			// user.subscribe_step = 31;
			// user.save();
			// break;

			default: //already subscribed. Resubscribe
			break;
		}
	}

	if (!user.has_subscribed){
		if (sendDidntUnderstand)
			sendSubscribe(user, res, resp, didntUnderstand);
		else sendSubscribe(user, res, resp);
	}

	// sendMessageResp(resp, res, body, user);
}


function getNumFromString(str){
	var matches = str.match(/(\d+)/);
	if (matches && matches[0])
		return Number(matches[0]);
	else return null;
}

function sendMessageResp(resp, res, body, user){
	console.log(sprintf("Responding to message %s from %s with %s...", user.last_message_received, user.phone_number, body));
	resp.message(body);
	res.send(resp.toString());
	user.last_message_sent = body;
	user.last_time_messaged = Date.now();
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


module.exports = router;
