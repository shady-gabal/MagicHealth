var express = require('express');
var router = express.Router();
var User = require('../db/User.js');
var sprintf = require('sprintf-js').sprintf;
var PregnancyTextUpdate = require('../db/PregnancyTextUpdate.js');
var VaccineTextUpdate = require('../db/VaccineTextUpdate.js');

var fs = require('fs');
// var schedule = require('node-schedule');

var mongoose = require('../db/mongoose_connect.js');
// Your accountSid and authToken from twilio.com/user/account
var twilio = require('twilio');
var accountSid = 'AC35c4885b8ea34af7e3f36efa03f18f0f';
var authToken = "b950959ade49e8d6fa835691bfa1a029";
var client = twilio(accountSid, authToken);

// var SEND_TEXT_UPDATES_HOUR = 15;


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


/* ALL DEBUGGING METHODS */
router.get('/reset', function(req, res){
	User.remove({}, function(){
		res.send("Ok bossman"); //delete all users
	});
});

router.get('/resetShadyPreggers', function(req, res){
	var query = User.where({phone_number: "13472102276"});
	query.findOne(function(err, user){
		if (!err){
			if (user){
				user.first_name = "Shady";
				user.day_to_receive_messages = (new Date()).getDay();
				user.finished_vaccines = [];
				user.sent_vaccine_updates = [];

				user.pregnant = true;
				user.num_days_pregnant = 100;
				user.has_subscribed = true;
				user.subscribe_step = 31;


				user.save();
				res.send("Fix er upper boooiiiiii aii");
			}
			else res.send("No user found");
		}
		else res.send("Error");
	});
});

router.get('/resetShadyChild', function(req, res){
	var query = User.where({phone_number: "13472102276"});
	query.findOne(function(err, user){
		if (!err){
			if (user){
				user.first_name = "Shady";
				user.day_to_receive_messages = (new Date()).getDay();
				user.finished_vaccines = [];
				user.sent_vaccine_updates = [];

				user.pregnant = false;
				user.has_child = true;
				user.num_days_child = 31;
				user.num_days_pregnant = 1;
				user.has_subscribed = true;
				user.subscribe_step = 31;
				user.save();
				res.send("Ugh fine shady");
			}
			else res.send("No user found");
		}
		else res.send("Error");
	});
});



router.get('/refillPregInfo', function(req, res){
	var body = "";
	PregnancyTextUpdate.remove({}, function(){
		body += 'Removed old data.\n';

		fs.readFile('input_data/pregnancy_tips', 'utf8', function (err,fileData) {
		  if (err) {
		     body += err;
		  }
		  else{
		  	var data = fileData.split("\n\n");

		  	data.forEach(function(tuple){
		  		var arr = tuple.split("\n");
		  		var week = parseInt(arr[0]);
		  		var info = arr[1];
		  		body += "Creating " + week + " : " + info + " \n\n";

		  		var p = new PregnancyTextUpdate({
		  			week: week,
		  			data: info
		  		});
		  		p.save();
		  	});
		  }
		  res.send(body);
		});
	});

});


router.get('/refillVaccInfo', function(req, res){
	var body = "";
	VaccineTextUpdate.remove({}, function(){
		body += 'Removed old data.\n';

		fs.readFile('input_data/vaccine_data', 'utf8', function (err,fileData) {
		  if (err) {
		     body += err;
		  }
		  else{
		  	var data = fileData.split("\n\n");

		  	data.forEach(function(tuple){
		  		var arr = tuple.split("\n");
		  		var month = parseInt(arr[0]);
		  		var info = arr[1];
		  		body += "Creating " + month + " : " + info + " \n\n";

		  		var v = new VaccineTextUpdate({
		  			month: month,
		  			data: info
		  		});
		  		v.save();
		  	});
		  }
		  res.send(body);
		});
	});

});

router.get('/sendVaccineUpdates', function(req, res){
	var run = require('../scheduled_jobs/send_vaccine_updates.js');
	run();
	res.send("okay");
});

router.get('/getPregInfo', function(req, res){
	var body = "Fetching...\n\n";
	var q = PregnancyTextUpdate.where({});
	q.find(function(err, tus){
		tus.forEach(function(tu){
			body += ("week " + tu.week + " data: " + tu.data);
		});
		res.send(body);
	});
});

router.get('/getVaccInfo', function(req, res){
	var body = "Fetching...\n\n";
	var q = VaccineTextUpdate.where({});
	q.find(function(err, tus){
		tus.forEach(function(tu){
			body += ("month " + tu.month + " data: " + tu.data);
		});
		res.send(body);
	});
});


/* *** */

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
					last_message_received: messageReceived,
					sent_vaccine_updates : [],
					finished_vaccines : []
				});
				newUser.save();
				receiveSubscribe(newUser, res, resp, messageReceived);
			}
			else{
				user.last_message_received = messageReceived;
				console.log("Retrieved account for phone number " + phoneNumber);

				messageReceived = messageReceived.toLowerCase();

				if (messageReceived.indexOf("unsubscribe") != -1){
					user.remove();
					body = "You have been unsubscribed.";
				}
				else if (messageReceived.indexOf("gave birth") != -1 && user.pregnant && user.has_subscribed){
					gaveBirth(user);
				}
				else if (messageReceived.indexOf("done") != -1 && user.has_subscribed && user.has_child){
					tookVaccine(user);
				}
				else receiveSubscribe(user, res, resp, messageReceived);
			}
		}


		if (body){
			sendMessageResp(resp, res, body, user);
		}
	});	


	console.log(resp.toString());
});


function gaveBirth(user){
	user.pregnant = false;
	user.has_child = true;
	user.num_days_child = 1;
	user.save();
	sendMessage(user.phone_number, "Congratulations!!!!! We hope he or she is a healthy child! We'll stop texting you pregnancy tips and start texting you information on which vaccines your child should be receiving.");
}


function tookVaccine(user){
	var item = user.sent_vaccine_updates[user.sent_vaccine_updates.length - 1];
	if (item != null && user.finished_vaccines.indexOf(item) == -1){
		user.sent_vaccine_updates.pop();
		console.log("User " + user.phone_number + " has taken vaccine " + item);
		user.finished_vaccines.push(item);
		user.markModified('finished_vaccines');
		user.save();
		sendMessage(user.phone_number, "Got it. Good job!");
	}
	else sendMessage(user.phone_number, "Your child has already taken all the vaccines required so far at their age.");

}


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

		case 11://Today is ..
		var arr = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		var intDay = (new Date()).getDay();
		body += "Today is " + arr[intDay] + ". Would you like to receive your weekly text now?";
		break;

		case 31:
		body += "Thanks for subscribing " + user.first_name + "! If you ever change your mind, just text us 'unsubscribe' to unsubscribe. We will start messaging you soon with helpful tips on ";
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
			var days = ["sun", "mon", "tues", "wed", "thurs", "fri", "sat"];
			
			var index = -1;
			for (var i = 0; i < days.length; i++){
				if(day.indexOf(days[i]) != -1){
					index = i;
					break;
				}
			}

			// var index = days.indexOf(day);
			if (index == -1 || isNaN(index)){
				didntUnderstand = "Sorry, we didn't understand that. Please enter any day from Monday - Sunday.";
				sendDidntUnderstand = true;

			}
			else{
				console.log("Day is " + day + ". index is " + index);
				// var intDay = index;
				user.day_to_receive_messages=  index;


				var date = new Date();
				var today = date.getDay();//timezone is utc - since you're checking every day it's fine but if you werent you'd have to align the timezone to where the user is	
				var hour = date.getHours();

				if (today == index){
					user.subscribe_step = 11;
					// user.subscribe_step = 31;
				}
				else{
					user.subscribe_step = 31;
				}
				user.save();

			}

			break;

			case 11:
			if (messageReceived.indexOf('yes') != -1 || messageReceived.indexOf('yea') != -1 || messageReceived.indexOf('yeah') != -1){
				sendCorrectTextUpdate(user);
				user.subscribe_step = 31;
				user.save();
			}
			else if (messageReceived.indexOf('no') != -1){
				user.subscribe_step = 31;
				user.save();
			}
			else{
				didntUnderstand = "We didn't understand that. Please answer yes or no.";
				sendDidntUnderstand = true;
			}
			break;


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
			        console.log(responseData.from);
			        console.log(responseData.body); 
			    }
			    else{
			    	console.log(err);
			    }
			    // res.send(output);
			});
}

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

module.exports = router;
