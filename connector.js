window.TrelloPowerUp.initialize({
  'board-buttons': function(t, options) {
    return t.get('board', 'private', 'savedFilters', { presets: [], filteredCardIds: [], activeFilter: null })
      .then(async (data) => {
        if (data.activeFilter && data.filteredCardIds.length > 0) {
          // Re-apply client-side hiding on load
          await applyClientSideFilter(t, data.filteredCardIds);
          console.log('Re-applied client-side filter on startup');
        }
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
      });
  },
  'card-badges': function(t, options) {
    return t.card('id')
      .then(card => {
        if (!card || !card.id) {
          console.log('Skipping badge evaluation: no card id');
          return [];
        }
        return t.get('board', 'private', 'savedFilters')
          .then(data => {
            console.log('Badge data for card', card.id, ':', data);
            if (data && data.activeFilter && data.filteredCardIds.includes(card.id)) {
              console.log('Applying Filtered badge to card', card.id);
              return [{ text: 'Filtered', color: 'blue' }];
            } else {
              console.log('No Filtered badge for card', card.id);
              return [];
            }
          });
      })
      .catch((err) => {
        console.error('Error in card-badges:', err);
        return [];
      });
  }
}, { appKey: "72d09526a2855680e12a04e38b04637c", appName: "Saved Filters", appAuthor: "GPT AddIns" });

async function applyClientSideFilter(t, filteredCardIds) {
  const cards = await t.cards('id');
  const filteredSet = new Set(filteredCardIds);
  cards.forEach(card => {
    if (filteredSet.has(card.id)) {
      t.showCard(card.id);
    } else {
      t.hideCard(card.id);
    }
  });
}
