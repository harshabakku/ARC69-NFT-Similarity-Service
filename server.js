const express = require('express');
const formData = require('express-form-data');
const path = require('path');
  
//Initialize Express
const app = express(); 

// Init Middleware
app.use(express.json({ extended: false }))
app.use(express.urlencoded({ extended: true }));
app.use(formData.parse())

if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
    });
};
 
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.group(`  Server Started On ${PORT}`));