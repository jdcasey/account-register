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

  Template.body.helpers({

    notEditing: function(){
      var editing = Session.get("editing");
      if ( ! editing ){
        return true;
      }
    },


    hasUndo: function(){
      return Session.get("undoDelete") != null;
    },


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


    entries_per_pg: function(){
      return Session.get("perPage");
    },


    current_page: function(){
      return Session.get("currentPage") + 1;
    },


    current_entries: function(){
      Meteor.loadEntries();
      return Session.get("currentEntries");
    },


    current_balance: function(){
      if ( Session.get("currentBalance") == null ){
        Meteor.loadCalculatedDetails();
      }

      return Session.get("currentBalance");
    },


    transaction_count: function(){
      if ( Session.get("currentCount") == null ){
        Meteor.loadCalculatedDetails();
      }

      return Session.get("currentCount");
    },


    page_count: function(){
      if ( Session.get("currentCount") == null ){
        Meteor.loadCalculatedDetails();
      }

      var perPg = Session.get("perPage");
      var count = Session.get("currentCount");
      return Math.ceil(count / perPg);
    }

  });

  Template.register_entry.helpers({

    editing: function(){
      return _.isEqual(this._id, Session.get("editing"));
    },


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

    'click #undo_delete': function(evt){
      var undid = Session.get("undoDelete");
      Meteor.call('addRegisterEntry', undid, function(error, result){
        if ( error ){
          console.log(error);
        }
        else{
          Session.set("undoDelete", null);
        }
      });

      Meteor.refreshAll();
    },

    'click .editable': function(event){
      Session.set("editing", this._id);
    },


    'change #entries_per_pg': function(evt){
      var entries = parseInt(evt.target.value);
      console.log(entries + " entries per page");
      Session.set("perPage", entries);
      Meteor.refreshAll();
    },


    'change #page': function(evt){
      var perPg = Session.get("perPage");
      var count = Session.get("currentCount");
      var pgCount = Math.ceil(count / perPg);

      var pg = parseInt(evt.target.value) - 1;
      if ( pg < 0 ){
        pg = 0;
      }

      console.log("go to page " + (pg+1) + "/" + pgCount);
      if ( pg +1 > pgCount ){
        console.log("Reset page to end: " + pgCount);
        evt.target.value = pgCount;
        pg = pgCount -1;
      }

      Session.set("currentPage", pg);
      Meteor.refreshAll();
    },


    'change #accounts-select': function(event, template){
      var toLoad = $(event.target).val();
      Session.set("currentAccount", parseInt(toLoad));
      Meteor.refreshAll();
      Meteor.escape();
    },


    'click a.cancel_edit': function(evt){
      evt.preventDefault();
      Meteor.escape();
    },


    'submit #editing_entry': function(evt){
      evt.preventDefault();
      Meteor.escape();

      var id = evt.target._id.value;
      console.log("Raw date: '" + evt.target.date_txt.value + "'");
      var d = evt.target.date_txt.value;
      if ( d == "now"){
        d = new Date();
      }
      else{
        d = new Date(d);
      }

      var entry = {
        date: d,
        reconciled: evt.target.reconciled.checked,
        to_from: evt.target.to_from.value,
        type: (evt.target.type.checked ? 'debit' : 'credit'),
        amount: parseFloat(evt.target.amount.value),
        memo: evt.target.memo.value,
        tags: evt.target.tags_txt.value.trim().split(" ")
      };

      console.log("Updating entry " + id);
      Meteor.call("updateRegisterEntry", id, entry, function(error, result){
        if ( error ){
          console.log(error);
        }
        if ( result ){
          console.log("Saved: " + result);
        }
      });

      Meteor.refreshAll();
    },


    'submit #create_entry': function(evt){
      evt.preventDefault();
      Meteor.escape();

      var ca = Session.get("currentAccount");

      var d = evt.target.date_txt.value;
      if ( d == "now"){
        d = new Date();
      }
      else{
        d = new Date(d);
      }

      var entry = {
        accountId: ca,
        date: d,
        reconciled: evt.target.reconciled.checked,
        to_from: evt.target.to_from.value,
        type: (evt.target.type.checked ? 'debit' : 'credit'),
        amount: parseFloat(evt.target.amount.value),
        memo: evt.target.memo.value,
        tags: evt.target.tags_txt.value.trim().split(" ")
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
      evt.target.to_from.focus();

      Meteor.refreshAll();
    },


    'click .delete': function(evt){
      Meteor.escape();
      Meteor.call('removeRegisterEntry', this._id, function(error, result){
        if ( error ){
          console.log( error );
        }
        if ( result ){
          console.log(result + " removed.");
        }
      });

      Session.set("undoDelete", this);

      Meteor.refreshAll();
    },


    'click .reconciled': function(evt){
      Session.set("editing", null);
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
