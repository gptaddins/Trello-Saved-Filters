window.TrelloPowerUp.initialize({
  'board-buttons': function(t, options) {
    return t.get('board', 'private', 'savedFilters', { presets: [], filteredCardIds: [], activeFilter: null })
      .then(async (data) => {
        if (data.activeFilter) {
          // Re-compute and apply filter on load
          data.filteredCardIds = await computeFilteredCardIds(t, data.activeFilter);
          await t.set('board', 'private', 'savedFilters', data);
          await applyClientSideFilter(t, data.filteredCardIds);
          console.log('Re-applied filter on startup');
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

async function computeFilteredCardIds(t, filter) {
  if (!filter || (!filter.text && !filter.status && !filter.assignee)) {
    const cards = await t.cards('id');
    return cards.map(c => c.id);
  }

  const query = await getFilterQuery(t, filter);

  const board = await t.board('id');
  const client = await t.getRestApi();
  let token = await client.getToken();
  if (!token) {
    try {
      await client.authorize();
      token = await client.getToken();
    } catch (err) {
      console.error('Authorization failed:', err);
      return [];
    }
  }

  const url = `https://api.trello.com/1/search?key=72d09526a2855680e12a04e38b04637c&token=${token}&query=${encodeURIComponent(query)}&idBoards=${board.id}&modelTypes=cards&card_fields=id&partial=true`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const response = await res.json();
    console.log('Search API called with query:', query, 'Response:', response);
    return response.cards ? response.cards.map(card => card.id) : [];
  } catch (err) {
    console.error('Search API fetch failed:', err);
    return [];
  }
}

async function getFilterQuery(t, filter) {
  const [listName, username] = await Promise.all([
    filter.status ? t.lists('id', 'name').then(lists => lists.find(l => l.id === filter.status)?.name) : null,
    filter.assignee ? t.board('members').then(board => board.members.find(m => m.id === filter.assignee)?.username) : null
  ]);

  const queryParts = [];
  if (filter.text) queryParts.push(filter.text);
  if (listName) queryParts.push(`list:"${listName}"`);
  if (username) queryParts.push(`member:${username}`);
  return queryParts.join(' ');
}

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
