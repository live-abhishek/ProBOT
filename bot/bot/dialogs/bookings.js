var builder = require('botbuilder');
var logger = require('../../log4js').logger;
var prorigoRest = require('../prorigoRest');

var lib = new builder.Library('booking');

lib.dialog('/ShowBookingStatus',[function(session,args,next){
    session.sendTyping();
    prorigoRest.getAllBookings(function(json){
        var bookingMessage = createBookingMessage(session, json);
        session.send(bookingMessage);
        session.endDialog();
    }, function(err){
        logger.error(err);
        session.endDialog('something_went_wrong');
    },{userId : 'test', channelId: 'skype'});
}]).triggerAction({
    matches: 'ShowBookingStatus'
});

lib.dialog('/ShowMyBookingStatus',[function(session,args,next){
    session.sendTyping();
    prorigoRest.getMyBookings(function(json){
        var bookingMessage = createBookingMessage(session, json);
        session.send(bookingMessage);
        session.endDialog();
    }, function(err){
        logger.error(err);
        session.endDialog('something_went_wrong');
    },{userId : 'test', channelId: 'skype'});
}]).triggerAction({
    matches: 'ShowBookingStatus'
});

lib.dialog('/CancelBooking',[function(session,args,next){
    session.sendTyping();
    prorigoRest.getMyBookings(function(json){
        var bookingMessage = createBookingMessage(session, json);
        session.send(bookingMessage);
        session.endDialog();
    }, function(err){
        logger.error(err);
        session.endDialog('something_went_wrong');
    },{userId : 'test', channelId: 'skype'});
}]).triggerAction({
    matches: 'ShowBookingStatus'
});

lib.dialog('/bookRoom', [
    function(session, args, next){
        session.sendTyping();
        parseBookingEntities(args.intent);
        session.dialogData.bookingInfo = {};
        next();
    }, function(session, results){
        if(!session.dialogData.bookingInfo.roomName){
            builder.Prompts.choice(session, 'Which room do you want to book?', ['Conf Room 4', 'Conf Room 1', 'Meeting room 3'], {listStyle : 3});
        }
    }, function(session, results){
        // do rest API to LUIS to determine the room
        session.dialogData.bookingInfo.roomName = results.response.entity;
        // if(!session.dialogData.bookingInfo.)
    }
]).triggerAction({
    matches: 'BookRoom'
});

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
    var roomEntity = builder.EntityRecognizer.findEntity(intent.entities, 'builtin.datetimeV2.datetimerange');
    // next 2 days
    var dateRange = builder.EntityRecognizer.findEntity(intent.entities, 'builtin.datetimeV2.daterange');
    // today/tomorrow
    var dateEntity = builder.EntityRecognizer.findEntity(intent.entities, 'builtin.datetimeV2.date');
    // 4pm to 5pm
    var timeRange = builder.EntityRecognizer.findEntity(intent.entities, 'builtin.datetimeV2.timerange');
    // 4:00
    var timeEntity = builder.EntityRecognizer.findEntity(intent.entities, 'builtin.datetimeV2.time');
    // 1 hour
    var durationEntity = builder.EntityRecognizer.findEntity(intent.entities, 'builtin.datetimeV2.duration');
    // cr1
    var roomEntity = builder.EntityRecognizer.findEntity(intent.entities, 'builtin.datetimeV2.room');
    
    var bookingRoom = getBookingRoom(roomEntity);
    var bookingStartTime = null;
    var bookinsEndTime = null;
    var bookingStartDate = null;
    var bookingEndDate = null;
}

function getBookingRoom(roomEntity){
    var room = null;
    if(roomEntity && roomEntity.resolution && roomEntity.resolution.values){
        room = roomEntity.resolution.values[0];
    }
    return room;
}

// Export createLibrary() function
module.exports.createLibrary = function () {
    return lib.clone();
};