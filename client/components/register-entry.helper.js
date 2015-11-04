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
