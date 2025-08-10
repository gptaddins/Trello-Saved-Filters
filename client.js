/* client.js - runs inside board to visually hide cards */
const t = window.TrelloPowerUp.initialize({
  appKey:"72d09526a2855680e12a04e38b04637c",
  appName:"Saved Filters",
  appAuthor:"GPT AddIns",
  'board': function(t) {
    async function applyFilter() {
      const ids = await t.get('board', 'private', 'filteredCardIds', []);
      const allCards = document.querySelectorAll('.list-card');
      allCards.forEach(card => {
        const href = card.querySelector('a.list-card-title')?.href || '';
        const match = ids.some(id => href.includes(id));
        card.style.display = match || ids.length === 0 ? '' : 'none';
      });
    }
    setInterval(applyFilter, 1000);
    return [];
  }
});
