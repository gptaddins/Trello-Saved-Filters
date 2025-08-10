const t = window.TrelloPowerUp.iframe({
      appKey: '72d09526a2855680e12a04e38b04637c',
      appName: 'Saved Filters',
      appAuthor: 'GPT AddIns'
    });

t.render(async () => {
  const lists = await t.lists('id', 'name');
  const statusSelect = document.getElementById('filter-status');
  statusSelect.innerHTML = '<option value="">Any</option>' + lists.map(list => `<option value="${list.id}">${list.name}</option>`).join('');

  const members = await t.board('members');
  const assigneeSelect = document.getElementById('filter-assignee');
  assigneeSelect.innerHTML = '<option value="">Any</option>' + members.map(member => `<option value="${member.id}">${member.fullName}</option>`).join('');

  const data = await t.get('board', 'private', 'savedFilters', { presets: [], filteredCardIds: [], activeFilter: null });
  updatePresetsList(data.presets);

  if (data.activeFilter) {
    document.getElementById('filter-text').value = data.activeFilter.text || '';
    statusSelect.value = data.activeFilter.status || '';
    assigneeSelect.value = data.activeFilter.assignee || '';
  }

  // Add event listeners here, after DOM is ready
  document.getElementById('apply-filter').addEventListener('click', () => {
    const activeFilter = {
      text: document.getElementById('filter-text').value,
      status: document.getElementById('filter-status').value,
      assignee: document.getElementById('filter-assignee').value
    };
    computeFilteredCardIds(t, activeFilter).then(filteredCardIds => {
      t.get('board', 'private', 'savedFilters').then(data => {
        data = data || { presets: [] };
        data.activeFilter = activeFilter;
        data.filteredCardIds = filteredCardIds;
        t.set('board', 'private', 'savedFilters', data).then(() => {
          applyFilter(t, filteredCardIds);
          t.closePopup();
        });
      });
    });
  });

  document.getElementById('clear-filter').addEventListener('click', () => {
    t.get('board', 'private', 'savedFilters').then(data => {
      data = data || { presets: [] };
      data.activeFilter = null;
      data.filteredCardIds = [];
      t.set('board', 'private', 'savedFilters', data).then(() => {
        t.cards('id').then(cards => {
          const allIds = cards.map(c => c.id);
          applyFilter(t, allIds);
          t.closePopup();
        });
      });
    });
  });

  document.getElementById('save-preset').addEventListener('click', () => {
    const preset = {
      name: prompt('Enter preset name:'),
      text: document.getElementById('filter-text').value,
      status: document.getElementById('filter-status').value,
      assignee: document.getElementById('filter-assignee').value
    };
    if (preset.name) {
      t.get('board', 'private', 'savedFilters').then(data => {
        data = data || { presets: [] };
        data.presets.push(preset);
        t.set('board', 'private', 'savedFilters', data).then(() => {
          updatePresetsList(data.presets);
        });
      });
    }
  });
});

function updatePresetsList(presets) {
  const list = document.getElementById('presets-list');
  list.innerHTML = '';
  presets.forEach((preset, index) => {
    const li = document.createElement('li');
    li.textContent = preset.name;
    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'Apply';
    applyBtn.onclick = () => {
      document.getElementById('filter-text').value = preset.text || '';
      document.getElementById('filter-status').value = preset.status || '';
      document.getElementById('filter-assignee').value = preset.assignee || '';
      document.getElementById('apply-filter').click();
    };
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => {
      t.get('board', 'private', 'savedFilters').then(data => {
        data.presets.splice(index, 1);
        t.set('board', 'private', 'savedFilters', data).then(() => {
          updatePresetsList(data.presets);
        });
      });
    };
    li.append(applyBtn, deleteBtn);
    list.appendChild(li);
  });
}

async function computeFilteredCardIds(t, filter) {
  if (!filter || (!filter.text && !filter.status && !filter.assignee)) {
    const cards = await t.cards('id');
    return cards.map(c => c.id);
  }

  const [listName, username] = await Promise.all([
    filter.status ? t.lists('id', 'name').then(lists => lists.find(l => l.id === filter.status)?.name) : null,
    filter.assignee ? t.board('members').then(members => members.find(m => m.id === filter.assignee)?.username) : null
  ]);

  const queryParts = [];
  if (filter.text) queryParts.push(filter.text);
  if (listName) queryParts.push(`list:"${listName}"`);
  if (username) queryParts.push(`member:${username}`);
  const query = queryParts.join(' ');

  const board = await t.board('id');
  const response = await t.restApi().get('/search', {
    query,
    idBoards: board.id,
    modelTypes: 'cards',
    card_fields: 'id',
    partial: true
  });
  console.log('Search API called with query:', query, 'Response:', response);
  return response.cards ? response.cards.map(card => card.id) : [];
}

function applyFilter(t, filteredCardIds) {
  t.cards('id').then(cards => {
    const filteredSet = new Set(filteredCardIds);
    cards.forEach(card => {
      if (filteredSet.has(card.id)) {
        t.showCard(card.id);
      } else {
        t.hideCard(card.id);
      }
    });
  });
}
