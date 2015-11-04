Meteor.methods({

  calculatedDetails: function(accountId){
    var loggedInUser = Meteor.user();
    if (! loggedInUser || !Roles.userIsInRole(loggedInUser, ['authorized_users', 'admin'])) {
      throw new Meteor.Error("not-authorized");
    }

    var cursor = RegisterEntries.find({'accountId': accountId});    
    var balance = 0.00;
    var count = 0;
    cursor.forEach(function(entry){
      count++;
      if ( entry.amount > 0 ){
        if ( entry.type == 'debit' ){
          balance = balance - entry.amount;
        }
        else{
          balance = balance + entry.amount;
        }
      }
    });

    return {'balance': balance, 'count': count};
  },


  currentEntries: function(config){
    var loggedInUser = Meteor.user();
    if (! loggedInUser || !Roles.userIsInRole(loggedInUser, ['authorized_users', 'admin'])) {
      throw new Meteor.Error("not-authorized");
    }

    var skip = config.pageSize * config.currentPage;
    var selector = {accountId: config.accountId};
    var options = {sort: {'date': -1}, 'skip': skip, 'limit': config.pageSize};
    return RegisterEntries.find(selector, options).fetch();
  }

});
