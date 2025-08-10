window.TrelloPowerUp.initialize({
  'board-buttons': function(t, options) {
    return t.get('board', 'private', 'savedFilters', { presets: [], filteredCardIds: [], archivedByFilter: [], activeFilter: null })
      .then(async (data) => {
        if (data.activeFilter && data.archivedByFilter && data.archivedByFilter.length > 0) {
          // Re-apply filter on load by archiving any that are now open
          const allCards = await t.cards('all', 'id', 'closed');
          const toArchive = data.archivedByFilter.filter(id => {
            const card = allCards.find(c => c.id === id);
            return card && !card.closed;
          });
          if (toArchive.length > 0) {
            await archiveCards(t, toArchive);
            console.log('Re-archived cards on startup:', toArchive);
          }
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
    console.log({options:options})
    if (!options || !options.card || !options.card.id) {
      console.log('Skipping badge evaluation: undefined card');
      return [];
    }
    return t.get('board', 'private', 'savedFilters')
      .then(function(data) {
        console.log('Badge data for card', options.card.id, ':', data);
        if (data && data.activeFilter && data.filteredCardIds.includes(options.card.id)) {
          console.log('Applying Filtered badge to card', options.card.id);
          return [{ text: 'Filtered', color: 'blue' }];
        } else {
          console.log('No Filtered badge for card', options.card.id);
          return [];
        }
      })
      .catch((err) => {
        console.error('Error in card-badges:', err);
        return [];
      });
  }
}, { appKey: "72d09526a2855680e12a04e38b04637c", appName: "Saved Filters", appAuthor: "GPT AddIns" });

async function archiveCards(t, cardIds) {
  const appKey = "72d09526a2855680e12a04e38b04637c";
  const client = await t.getRestApi();
  let token = await client.getToken();
  if (!token) {
    await client.authorize();
    token = await client.getToken();
  }

  const promises = cardIds.map(id => {
    const url = `https://api.trello.com/1/cards/${id}?closed=true&key=${appKey}&token=${token}`;
    return fetch(url, { method: 'PUT' }).catch(err => console.error(`Failed to archive card ${id}:`, err));
  });
  await Promise.all(promises);
}
