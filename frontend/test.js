async function test() {
  const query = `
    query { 
      Media(search: "Jujutsu Kaisen", type: ANIME) { 
        staff(sort: RELEVANCE, perPage: 3) {
          edges {
            role
            node {
              name { full }
              image { large }
            }
          }
        }
      } 
    }
  `;
  const res = await fetch('https://graphql.anilist.co', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ query }) 
  });
  console.log(JSON.stringify(await res.json(), null, 2));
}
test();
