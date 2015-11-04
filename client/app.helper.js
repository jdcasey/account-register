
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


  entries_per_pg_selections: function(){
    return [5, 10, 25, 50, 100];
  },

  current_page: function(){
    return Session.get("currentPage") + 1;
  },

  page_selections: function(){
    var selections = [];
    for(var i=1; i<=Meteor.getPageCount(); i++){
      selections.push(i);
    }

    return selections;
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
    return Meteor.getPageCount();
  },

});

