const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
const PORT = 3001;

app.use(cors()); // 允许跨域请求

app.post('/api/ping', async (req, res) => {
  const { ip } = req.body;
  if (!ip) {
    return res.status(400).send('IP address is required');
  }
  try {
    let ping = require('child_process').spawn('ping', ['-n', '3', ip]);
    let iconv = require('iconv-lite');
    var all = "";
    ping.stdout.on('data', data => {
      const result = iconv.decode(data, 'cp936');
      console.log(result);
      all = result;
    });
    ping.stderr.on('data', data => {
      console.log("stderr", data)
    });
    ping.on('close', code => {
      res.send(all);
    });
  } catch (error) {
    res.status(500).send(JSON.stringify(error));
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

