const fs = require('fs');
const Nightmare = require('nightmare');
const nm = Nightmare({show: true});
const baseUrl = 'http://www.nhm.ac.uk';
let acc = [];

// step gets all the urls you need to go to
nm.goto(`${baseUrl}/discover/dino-directory/name/name-az-all.html`)
  .evaluate(function() {
    let results = [];
    let dinoLinks = document.querySelectorAll('.dino-list a');

    for(let i=0; i < dinoLinks.length; i++) {
      results.push(dinoLinks[i].getAttribute('href'));
    }

    return results;
  }).then(crawl).catch(bail);

// recursive function: another way to loop
function crawl(urls) {
  if (urls.length < 2) {
    nm.goto(baseUrl + urls.pop())
      .evaluate(scrape, acc)
      .end()
      .then(function(result) {
        acc = result;
        let dinos = { dinosaurs: acc };
        // add feature: if file does not exist then create it
        // when it tries to write it throws an error
        fs.writeFileSync('results/dinos.json', JSON.stringify(dinos), 'utf8');
        console.log(`Finished scraping ${acc.length} dinos to results/dinos.json`);
      })
      .catch(bail);
  } else {
    nm.goto(baseUrl + urls.pop())
      .evaluate(scrape, acc)
      .then(function(result) {
        acc = result;
        crawl(urls);
      })
      .catch(bail);
  }
}

function scrape(acc) {
  let result = {};
  let keys = document.querySelectorAll('.dino-facts dt');
  let values = document.querySelectorAll('.dino-facts dd');

  for (let i=0; i<keys.length; i++) {
    let words = keys[i].innerText.trim().split(' ')
    let key = words.map(function(w, i) {
      return w.toLowerCase();
    }).join('_');

    result[key] = values[i].innerText.trim();
  }

  result['name'] = document.querySelector('#dino-intro h2').innerText;

  acc.push(result);
  return acc;
}

function bail(err) {
  console.error(err);
}
