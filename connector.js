window.TrelloPowerUp.initialize({
  'board-buttons': function(t, options) {
    return [{
      icon: 'https://avatars.githubusercontent.com/u/224228586',
      text: 'Saved Filters',
      callback: function(t) {
        return t.popup({
          title: 'Saved Filters',
          url: './popup.html',
          height: 300
        });
      }
    }];
  },
  'card-badges': function(t, options) {
    return t.get('board', 'private', 'savedFilters')
      .then(function(data) {
        if (data && data.activeFilter && data.filteredCardIds.includes(options.card.id)) {
          return [{ text: 'Filtered', color: 'blue' }];
        } else {
          return [];
        }
      })
      .catch(() => []);
  }
}, { appKey: "72d09526a2855680e12a04e38b04637c", appName: "Saved Filters" });
