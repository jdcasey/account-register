Meteor.escape = function(){
  Session.set("editing", null);
};

Meteor.loadEntries = function(){
  var ca = Session.get("currentAccount");
  var pg = Session.get("currentPage");
  var perPg = Session.get("perPage");
  Meteor.call("currentEntries", {accountId: ca, currentPage: pg, pageSize: perPg}, function(error, entries){
    if ( error ){
      console.log(error);
    }else{
      Session.set("currentEntries", entries);
    }
  });
};

Meteor.loadCalculatedDetails = function(){
  var ca = Session.get("currentAccount");
  Meteor.call('calculatedDetails', ca, function(error, details){
    if ( error ){
      console.log(error);
    }else{
      Session.set("currentBalance", details.balance);
      Session.set("currentCount", details.count);
    }
  });
};

Meteor.refreshAll = function(){
  Meteor.loadEntries();
  Meteor.loadCalculatedDetails();
};

Meteor.getPageCount = function(){
    if ( Session.get("currentCount") == null ){
      Meteor.loadCalculatedDetails();
    }

    var perPg = Session.get("perPage");
    var count = Session.get("currentCount");
    return Math.ceil(count / perPg);
};


// Handlebars / Spacebars helpers.

Template.registerHelper('formatDate', function(date) {
  return moment(date).format('MM/DD/YYYY HH:mm');
});

Template.registerHelper('formatAmount', function(amount) {
  return accounting.formatMoney(amount);
});

Template.registerHelper('now', function(){ 
  return moment(new Date()).format("MM/DD/YYYY HH:mm")
});

Template.registerHelper('formatYN', function(value) {
  return value == true ? 'Y' : 'N';
});

Template.registerHelper('formatYNEquals', function(value, test) {
  if (typeof value === 'object' && typeof test === 'object') {
    return _.isEqual(value, test) ? 'Y' : 'N'; // do a object comparison
  } else {
    return value === test ? 'Y' : 'N';
  }
});

Template.registerHelper('equals', function(value, test) {
  if (typeof value === 'object' && typeof test === 'object') {
    return _.isEqual(value, test); // do a object comparison
  } else {
    return value === test;
  }
});
