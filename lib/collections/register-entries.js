RegisterEntries = new Mongo.Collection("register_entries");

Meteor.methods({
  invertReconciledBit: function(request){
    var loggedInUser = Meteor.user();
    if (! loggedInUser || !Roles.userIsInRole(loggedInUser, ['authorized_users', 'admin'])) {
      throw new Meteor.Error("not-authorized");
    }

    return RegisterEntries.update(request.id, {$set: { 'reconciled': !request.state}});
  },
  addRegisterEntry: function(entry){
    var loggedInUser = Meteor.user();
    if (! loggedInUser || !Roles.userIsInRole(loggedInUser, ['authorized_users', 'admin'])) {
      throw new Meteor.Error("not-authorized");
    }

    return RegisterEntries.insert(entry);
  },
  removeRegisterEntry: function(id){
    var loggedInUser = Meteor.user();
    if (! loggedInUser || !Roles.userIsInRole(loggedInUser, ['authorized_users', 'admin'])) {
      throw new Meteor.Error("not-authorized");
    }

    return RegisterEntries.remove(id);
  },
  updateRegisterEntry: function(id, entry){
    var loggedInUser = Meteor.user();
    if (! loggedInUser || !Roles.userIsInRole(loggedInUser, ['authorized_users', 'admin'])) {
      throw new Meteor.Error("not-authorized");
    }

    console.log("Updated amount: " + entry.amount);
    return RegisterEntries.update(id, {$set: entry});
  },
});
