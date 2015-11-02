Accounts = new Mongo.Collection("accounts");
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
  getAccounts: function(){
    var loggedInUser = Meteor.user();
    if (! loggedInUser || !Roles.userIsInRole(loggedInUser, ['authorized_users', 'admin'])) {
      throw new Meteor.Error("not-authorized");
    }

    return Accounts.find().fetch();
  },
});

if (Meteor.isClient) {
  Session.setDefault('currentAccount', 1);
  Session.setDefault("currentPage", 0);
  Session.setDefault("perPage", 25);

  Meteor.subscribe('accounts');
  Meteor.subscribe('register_entries');

  Template.body.helpers({
    selectable_accounts: function(){
      Meteor.call('getAccounts', function(error, result){
        if ( error ){
          console.log(error);
        }
        if ( result ){
          Session.set("accounts", result );
        }
      });

      return Session.get("accounts");
    },
    isSelected: function(){
      return this.id === Session.get("currentAccount");
    },
    current_entries: function(){
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

      return Session.get("currentEntries");
    },
    current_balance: function(){
      var ca = Session.get("currentAccount");
      Meteor.call('calculatedDetails', ca, function(error, details){
        if ( error ){
          console.log(error);
        }else{
          Session.set("currentBalance", details.balance);
        }
      });

      return Session.get("currentBalance");
    },
    transaction_count: function(){
      var ca = Session.get("currentAccount");
      Meteor.call('calculatedDetails', ca, function(error, details){
        if ( error ){
          console.log(error);
        }else{
          Session.set("currentCount", details.count);
        }
      });

      return Session.get("currentCount");
    }
  });

  Template.register_entry.helpers({
    formatEntryClass: function(type){
      if ( type == 'debit'){
        return "debit-entry";
      }
      else{
        return "credit-entry";
      }
    },
    formatSignedAmount: function(){
      if ( this.type == 'debit' ){
        return accounting.formatMoney(this.amount * -1);
      }

      return accounting.formatMoney(this.amount);
    }
  });

  Template.body.events({
    'change #accounts-select': function(event, template){
      var toLoad = $(event.target).val();
      Session.set("currentAccount", parseInt(toLoad));
    },
    'submit #create_entry': function(evt){
      evt.preventDefault();

      var ca = Session.get("currentAccount");
      var dateParts = evt.target.date_txt.value.split(/- :/);
      var entry = {
        accountId: ca,
        date: new Date(evt.target.date_txt.value),
        reconciled: evt.target.reconciled.checked,
        to_from: evt.target.to_from.value,
        type: evt.target.type.value,
        amount: parseFloat(evt.target.amount.value),
        memo: evt.target.memo.value,
        tags: evt.target.tags_txt.value.split(" ")
      };

      console.log("Adding entry");
      Meteor.call("addRegisterEntry", entry, function(error, result){
        if ( error ){
          console.log(error);
        }
        if ( result ){
          console.log("Added: " + result);
        }
      });

      evt.target.date_txt.value = moment(new Date()).format("MM-DD-YYYY HH:mm");
      evt.target.reconciled.checked = false;
      evt.target.to_from.value = "";
      evt.target.type.value = "debit";
      evt.target.amount.value = "";
      evt.target.memo.value = "";
      evt.target.tags_txt.value = " ";

      var pg = Session.get("currentPage");
      var perPg = Session.get("perPage");
      Meteor.call("currentEntries", {accountId: ca, currentPage: pg, pageSize: perPg}, function(error, entries){
        if ( error ){
          console.log(error);
        }else{
          Session.set("currentEntries", entries);
        }
      });
    },
    'click .reconciled': function(evt){
      Meteor.call('invertReconciledBit', {'id': this._id, 'state': this.reconciled}, function(error, result){
        if ( error ){
          console.log(error);
        }
        if ( result ){
          console.log("Updated: " + result );
        }
      });

      this.reconciled = !this.reconciled;
    }
  });

  Template.registerHelper('formatDate', function(date) {
    return moment(date).format('MM-DD-YYYY HH:mm');
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

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

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
}
