const express = require('express');
const formData = require('express-form-data');
const path = require('path');
const listingsData = require('./deprecated/listingsData');
const similarityService =  require('./routes/api/similarityService');
const config = require('./config');
const { pingElasticsearch } = require('./src/elasticsearch/ping');
const { periodicIndexFullCollection } = require('./src/common/collection');
  
//Initialize Express
const app = express(); 


// Init Middleware
app.use(express.json({ extended: false }))
app.use(express.urlencoded({ extended: true }));
app.use(formData.parse())

//Define Routes
app.use('/api/listingsData', listingsData); //deprecated as listing data is also available in fullCollection Data.
app.use('/api/similarityService', similarityService);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
    });
};
 
const PORT = config.expressServerPort || 5000;

app.listen(PORT, () => console.group(`Express Server Started On ${PORT}`));

pingElasticsearch()
periodicIndexFullCollection(config.defaultCollection);