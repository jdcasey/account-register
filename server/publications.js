Meteor.publish("accounts", function(){
  if ( Roles.userIsInRole(this.userId, ['authorized_users', 'admin']) ){
    return Accounts.find();
  } else {
    this.stop();
    return;
  }
});

Meteor.publish("register_entries", function(){
  if ( Roles.userIsInRole(this.userId, ['authorized_users', 'admin']) ){
    return RegisterEntries.find();
  } else {
    this.stop();
    return;
  }
});

