require('log-timestamp');
const express = require('express');
const router = express.Router();
const axios = require('axios')
const client = require('../../elasticsearch/connection');
require('events').EventEmitter.defaultMaxListeners = 0; //several async functions running in parallel while indexing assets to elasticsearch. //bulkIndex, batchProcessIndexing to elasticsearch is another solution. 

const algoSeasListingsURL = `https://d3ohz23ah7.execute-api.us-west-2.amazonaws.com/prod/marketplace/v2/assetsByCollection/AlgoSeas%20Pirates?type=listing&sortBy=price&sortAscending=true&limit=500`;


//convert booleans to string as elasticsearch schema fails to understand  {"Shirts": "Flow"}, if {"Shirts": false} is already added for other document(asset)
 function replacer(key, value) {
    if (typeof value === "boolean") {
      return String(value);
    }
    return value;
  }

router.get('/indexAllDocs', async function (req, res) {
    console.log('Loading Application...')
    // res.json('Application Running...')
    
    //======= Check that Elasticsearch is up and running =======\\ //only works for Elastic Cloud cluster
    pingElasticsearch = async () => {
        await client.ping(
            function(error,res) {
                if (error) {
                    console.error('elasticsearch cluster is down!');
                } else {
                    console.log('Elasticsearch Ready');
                }
            }
        );
    }

    // ====== Get Data From AlgoSeas API (or Web3 in the future) and then index onto Elasticsearch
    indexAllDocs = async () => {
        try {
             
            console.log('Getting Data From AlgoSeas Listings API')

            const result = await axios.post(`${algoSeasListingsURL}`,{},{
                headers: {
                    "Content-Type": "application/json"
                }                                
            });

            console.log('Data Received!')

            const algoSeasListings = result.data.assets

            console.log('Indexing Data...')

            console.log("no. of listings assets fetched " + algoSeasListings.length)

            
            algoSeasListings.map(async algoSeasListing => (
            
                assetProps = algoSeasListing.assetInformation.nProps.properties,

                //add additional key fields to be indexed to es.
                
                assetProps.price = algoSeasListing.assetInformation.listing.price,
                assetProps.listedAlgoAmount = algoSeasListing.marketActivity.listedAlgoAmount, //price and listedAlgoAmount are same...
                assetProps.nName =  algoSeasListing.assetInformation.nName,
                assetProps.id   = assetProps.nName.split("#")[1],  
                
                console.log(assetProps),
                //convert booleans to string as elasticsearch schema fails to understand  {"Shirts": "Flow"}, if {"Shirts": false} is already added for other document(asset)
                assetProps = JSON.parse(JSON.stringify(assetProps, replacer)),

                console.log(assetProps),

                await client.index({ 
                    index: 'algoseaspirates', //need to be generic for any collection...
                    id:  assetProps.id,
                    body: assetProps
                }), (err, resp, status) => {
                    console.log(resp);
                }
                                
                ));

            console.log('All Listings Assets Have Been Indexed!');
            
            res.json(algoSeasListings)
            
            
        } catch (err) {
            console.log(err)
        };

        console.log('Preparing For The Next Data Check...');
    }

    pingElasticsearch()
    indexAllDocs()
});
 
module.exports = router;