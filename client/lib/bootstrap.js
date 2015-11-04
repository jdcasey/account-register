Meteor.startup(function(){
  var loggedInUser = Meteor.user();
  if (! loggedInUser || !Roles.userIsInRole(loggedInUser, ['authorized_users', 'admin'])) {
    throw new Meteor.Error("not-authorized");
  }

  $(document).keyup(function(evt){
    if ( evt.key === 'Escape'){
      Meteor.escape();
    }
  });

  Meteor.refreshAll();
});

