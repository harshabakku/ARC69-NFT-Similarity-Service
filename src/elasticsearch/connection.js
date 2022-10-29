require('log-timestamp');
const { Client } = require('@elastic/elasticsearch');
const config = require("../../config.js");


const nodeURL = config.elasticSearchServerURL;

console.log( "connecting to Elasticsearch node: "+ nodeURL)


const client = new Client({  
    
    node : nodeURL, 
    maxRetries: 5,
    sniffOnStart: true,
    log: 'trace'
    
// node : "http://172.18.0.2:9200/",  //localnode

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