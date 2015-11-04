Accounts = new Mongo.Collection("accounts");

Meteor.methods({

  getAccounts: function(){
    var loggedInUser = Meteor.user();
    if (! loggedInUser || !Roles.userIsInRole(loggedInUser, ['authorized_users', 'admin'])) {
      throw new Meteor.Error("not-authorized");
    }

    return Accounts.find().fetch();
  },

});