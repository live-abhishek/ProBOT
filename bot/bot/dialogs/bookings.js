var builder = require('botbuilder');
var logger = require('../../log4js').logger;
var prorigoRest = require('../prorigoRest');
var moment = require('moment');

var lib = new builder.Library('booking');

lib.dialog('/ShowBookingStatus',[
    function(session,args,next){
    session.sendTyping();
    var intent = args.intent;

    if(intent.entities){
        if(builder.EntityRecognizer.findEntity(intent.entities, 'myBooking')){
            prorigoRest.getMyBookings(function(json){
                var bookingMessage = createBookingMessage(session, json);
                session.send(bookingMessage);
                session.endDialog();
            }, function(err){
                logger.error(err);
                session.endDialog('something_went_wrong');
            },{userId : 'test', channelId: 'skype'});
        }else{
            prorigoRest.getAllBookings(function(json){
                var bookingMessage = createBookingMessage(session, json);
                session.send(bookingMessage);
                session.endDialog();
            }, function(err){
                logger.error(err);
                session.endDialog('something_went_wrong');
            },{userId : 'test', channelId: 'skype'});
            } 
        }else{
            prorigoRest.getAllBookings(function(json){
                var bookingMessage = createBookingMessage(session, json);
                session.send(bookingMessage);
                session.endDialog();
            }, function(err){
                logger.error(err);
                session.endDialog('something_went_wrong');
            },{userId : 'test', channelId: 'skype'});
        }
}]).triggerAction({
    matches: 'ShowBookingStatus'
});

lib.dialog('/CancelBooking',[function(session,args,next){
    session.sendTyping();
    prorigoRest.getMyBookings(function(jsonBody){
        if (jsonBody.length == 0){
            var showBookingsMessage = "You have no reserved room"
            session.send(showBookingsMessage)
        }else{
            var room_list = [];
            for (var i=0; i<jsonBody.length; i++){
                room_list[i] = jsonBody[i].room + "  "+ jsonBody[i].date + "  " + jsonBody[i].fromTime + " to " + jsonBody[i].toTime;
                }
                session.dialogData.room_list = jsonBody;
            builder.Prompts.choice(session, "Which room do you want to cancel?", room_list, {listStyle: 3})
            }
    }, function(err){
        logger.error(err);
        session.endDialog('something_went_wrong');
    },{userId : 'test', channelId: 'skype'});
},function(session,results){
    var meeting = session.dialogData.room_list[results.response.index];
    session.dialogData.meeting = meeting;
    var promptMsg1 = "Are you sure you want to cancel ";
    var promptMsg2 = meeting.room +" on " + meeting.date + " from " + meeting.fromTime + " to " + meeting.toTime + " ?";
    var promptMsg = promptMsg1 + promptMsg2;
    builder.Prompts.choice(session,promptMsg,["Yes","No"], {listStyle : 3});
    },
    function(session, results){
        session.dialogData.ans = results.response.entity;
        if(session.dialogData.ans == "Yes"){
            prorigoRest.cancelBookings(function(){
                session.endDialog("Booking deleted successfully!");
            }, function(){
                session.endDialog('something_went_wrong');
            },{user: {userId : 'test', channelId: 'skype'}, meeting: session.dialogData.meeting});
        }else{
            session.endDialog();
        }
    }    
    ]).triggerAction({
    matches: 'CancelRoom'
});

     
lib.dialog('/bookRoom', [
    function(session, args, next){
        session.sendTyping();
        var bookingInfo = parseBookingEntities(args.intent);
        if(!bookingInfo.startTime || !bookingInfo.endTime || bookingInfo.bookingDates.length == 0){
            session.endDialog('could_not_determine_booking_time');
        }
        session.dialogData.bookingInfo = bookingInfo;
        next();
    }, function(session, results){
        if(!session.dialogData.bookingInfo.bookingRoom){
            builder.Prompts.choice(session, 'Which room do you want to book?', ['Conf Room 4', 'Conf Room 1', 'Meeting room 3'], {listStyle : 3});
        }
    },function(session, results){
        session.dialogData.bookingInfo.bookingFromDate = results.response.entity;
        if(!session.dialogData.bookingInfo.bookingPurpose){
            builder.Prompts.text(session, 'Enter purpose of booking');
        }
    }, function(session, results){
        session.dialogData.bookingInfo.bookingPurpose = results.response.entity;
        session.endDialog();
    }
    // },function(session, results){
    //     session.dialogData.bookingInfo.
    // }
]).triggerAction({
    matches: 'BookRoom'
});

lib.dialog('/attendees', [

]);

function createBookingMessage(session, bookingJson){
    var bookingMessageText = '';
    if(bookingJson.length == 0){
        bookingMessageText = 'No bookings';
    } else {
        bookingJson.forEach(function(booking){
            bookingMessageText += '* Meeting in ' + booking.room + ' on ' + booking.date +' from ' 
            + booking.fromTime + ' to ' + booking.toTime + ' for ' + booking.reason + ' with ' + booking.attendees + '\n\n';
        });
    }
    
    var bookingMessage = new builder.Message(session);
    bookingMessage.text(bookingMessageText).textFormat('markdown');
    return bookingMessage;
}

function parseBookingEntities(intent){
    // 4:00 to 5:00 pm on next monday
    var dateTimeRangeEntity = builder.EntityRecognizer.findEntity(intent.entities, 'builtin.datetimeV2.datetimerange');
    // next 2 days
    var dateRangeEntity = builder.EntityRecognizer.findEntity(intent.entities, 'builtin.datetimeV2.daterange');
    // today/tomorrow
    var dateEntities = builder.EntityRecognizer.findAllEntities(intent.entities, 'builtin.datetimeV2.date');
    // 4pm to 5pm
    var timeRangeEntity = builder.EntityRecognizer.findEntity(intent.entities, 'builtin.datetimeV2.timerange');
    // 4:00
    var timeEntity = builder.EntityRecognizer.findEntity(intent.entities, 'builtin.datetimeV2.time');
    // 1 hour
    var durationEntity = builder.EntityRecognizer.findEntity(intent.entities, 'builtin.datetimeV2.duration');
    // cr1
    var roomEntity = builder.EntityRecognizer.findEntity(intent.entities, 'room');
    
    var bookingRoom = getBookingRoom(roomEntity);
    var bookingTimings = getBookingTimings(dateTimeRangeEntity, dateRangeEntity, dateEntities, timeRangeEntity, timeEntity, durationEntity);

    var bookingInfo = {
        bookingDates: bookingTimings[0], 
        bookingStartTime: bookingTimings[1],
        bookingEndTime: bookingTimings[2],
        bookingRoom: bookingRoom
    }

    return bookingInfo;
}

function getBookingTimings(dateTimeRangeEntity, dateRangeEntity, dateEntities, 
                        timeRangeEntity, timeEntity, durationEntity){
    var bookingDates = [];
    var startTime = null;
    var endTime = null;
    var duration = null;
    var thisYear = new Date().getFullYear();
    if(dateTimeRangeEntity){
        var start = dateTimeRangeEntity.resolution.values[0].start;
        startTime = moment(start, 'YYYY-MM-DD HH:mm:ss');
        startTime = moment(startTime.format('HH:mm:ss'), 'HH:mm:ss');
        
        var end = dateTimeRangeEntity.resolution.values[0].end;
        endTime = moment(end, 'YYYY-MM-DD HH:mm:ss');
        endTime = moment(endTime.format('HH:mm:ss'), 'HH:mm:ss');
        
        var bookingDate = moment(start, 'YYYY-MM-DD HH:mm:ss');
        bookingDates.push(moment(bookingDate.format('YYYY-MM-DD'), 'YYYY-MM-DD'));
    } else{
        if(dateRangeEntity){
            // what about if there are more dateRangeEntities
            // dates should start from this year
            var startDate = new Date(dateRangeEntity.resolution.values[0].start);
            var endDate = new Date(dateRangeEntity.resolution.values[0].end);
            for(var d = startDate; d <= endDate; d.setDate(d.getDate() + 1)){
                if(d.getFullYear() >= thisYear){
                    bookingDates.push(moment(d, 'YYYY-MM-DD'));
                }
            }
        } else if(dateEntities){
            for(var i = 0; i < dateEntities.length; i++){
                var todaysDate = new Date();
                todaysDate.setHours(0,0,0,0);
                var dateEntity = dateEntities[i];
                for(var j = 0; j < dateEntity.resolution.values.length; j++){
                    var value = dateEntity.resolution.values[j];
                    var valueDate = new Date(value.value);
                    if(todaysDate.getTime() < valueDate.getTime()){
                        bookingDates.push(moment(valueDate));
                    }
                }
            }
        }

        if(timeRangeEntity){
            var timeRangeEntityValues = timeRangeEntity.resolution.values;
            startTime = timeRangeEntityValues[0].start;
            endTime = timeRangeEntityValues[0].end;
            startTime = moment(startTime, 'HH:mm:ss');
            endTime = moment(endTime, 'HH:mm:ss');
        } else if(timeEntity){
            startTime = timeEntity.resolution.values[0].value;
            startTime = moment(startTime, 'HH:mm:ss');
        }
        if(durationEntity){
            duration = durationEntity.resolution.values[0].value;
            if(startTime){
                endTime = moment(startTime);
                endTime.add(parseInt(duration), 'seconds');
            }
        }
    }

    if(bookingDates.length == 0){
        bookingDates.push(moment(moment(new Date()).format('YYYY-MM-DD')), 'YYYY-MM-DD'); 
    }
    return [bookingDates, startTime, endTime];
}

function getBookingRoom(roomEntity){
    var room = null;
    if(roomEntity && roomEntity.resolution && roomEntity.resolution.values){
        room = roomEntity.resolution.values[0];
    }
    return room;
}

function numToTime(num) {
    var sec_num = parseInt(num, 10); // 2nd param is base
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}

// Export createLibrary() function
module.exports.createLibrary = function () {
    return lib.clone();
};