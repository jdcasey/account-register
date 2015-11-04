Session.setDefault('currentAccount', 1);
Session.setDefault("currentPage", 0);
Session.setDefault("perPage", 25);

Meteor.subscribe('accounts');
Meteor.subscribe('register_entries');

Meteor.startup(function () {
  $(document).keyup(function(e){
    if ( e.key === "Escape" ){
      Meteor.escape();
    }
  });
});
