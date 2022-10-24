const { Client } = require('@elastic/elasticsearch');

var client = new Client({  

    node : "http://172.18.0.2:9200/", 
    maxRetries: 5,
    sniffOnStart: true,
    log: 'trace'


// for secure elastic search node connection.    
//  node:"https://<username>:<password>[complete_host_url]" 


// Cloud ID if Elastic Cloud is being used.     
    //   cloud: {
    //     id: 'name:changeme'
    //   },


// use below for authentication  
    //   auth: {     
    //     username: 'elastic',
    //     password: 'changeme'
    //   }
});  
  
module.exports = client;  