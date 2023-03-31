const express = require('express');
const { default: fetch } = require('node-fetch');
const { Buffer } = require('buffer');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <form method="post" action="/submit">
      <label for="hexdata">Enter hexdata:</label>
      <input type="text" id="hexdata" name="hexdata">
      <button type="submit">Submit</button>
    </form>
  `);
});

app.post('/submit', (req, res) => {
  const hexdata = req.body.hexdata;
  const nID = Buffer.from(require('crypto').randomBytes(8)).toString('hex');
  const hexEncodedData = Buffer.from(hexdata, 'utf8').toString('hex');
  
  fetch('http://localhost:26659/submit_pfb', {
    method: 'POST',
    body: JSON.stringify({
      namespace_id: nID,
      data: hexEncodedData,
      gas_limit: 80000,
      fee: 2000
    }),
    headers: { 'Content-Type': 'application/json' }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('HTTP error ' + response.status);
    }
    return response.json();
  })
  .then(data => {
    const height = data.height;
    const txhash = data.txhash;

    return fetch(`http://localhost:26659/namespaced_shares/${nID}/height/${height}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('HTTP error ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        res.send(`Check TX: <a href="https://testnet.mintscan.io/celestia-incentivized-testnet/txs/${txhash}">${txhash}</a><br><br><a href="#" onclick="window.history.back()">Back</a>`);
      })
      .catch(error => console.error(error));
  })
  .catch(error => console.error(error));
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
