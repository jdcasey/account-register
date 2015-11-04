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
      Session.set("currentPage", 0);
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


    'click .cancel_edit': function(evt){
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
