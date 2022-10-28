const express = require('express');
const formData = require('express-form-data');
const path = require('path');
const client = require('./elasticsearch/connection');
const data = require('./deprecated/data');
const fullCollection = require('./routes/api/fullCollection');
const similarityService =  require('./routes/api/similarityService');
  
//Initialize Express
const app = express(); 


client.ping(
    function(error) {
      if (error) {
          console.error('Elasticsearch cluster is down!');
      } else {
          console.log('Elasticsearch cluster is connected');   //works only for Elastic Cloud cluster, and not for local
      }
    }
  );


// Init Middleware
app.use(express.json({ extended: false }))
app.use(express.urlencoded({ extended: true }));
app.use(formData.parse())

//Define Routes
app.use('/api/data', data); //deprecated as listing data is also available in fullCollection.
app.use('/api/fullCollection', fullCollection);
app.use('/api/similarityService', similarityService);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
    });
};
 
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.group(`  Server Started On ${PORT}`));