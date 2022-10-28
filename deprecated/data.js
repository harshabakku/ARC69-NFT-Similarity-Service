require('log-timestamp');
const express = require('express');
const router = express.Router();
const axios = require('axios')
const client = require('../elasticsearch/connection');
require('events').EventEmitter.defaultMaxListeners = 0; //several async functions running in parallel while indexing assets to elasticsearch. //bulkIndex, batchProcessIndexing to elasticsearch is another solution. 

const algoSeasListingsURL = `https://d3ohz23ah7.execute-api.us-west-2.amazonaws.com/prod/marketplace/v2/assetsByCollection/AlgoSeas%20Pirates?type=listing&sortBy=price&sortAscending=true&limit=500`;
const intervalDuration =  3600000  //dataFetchandIndexInterval duration in milli secs, change it to 60 secs before go live.

//convert booleans to string as elasticsearch schema fails to understand  {"Shirts": "Flow"}, if {"Shirts": false} is already added for other document(asset)
function replacer(key, value) {
    if (typeof value === "boolean") {
      return String(value);
    }
    return value;
  }

router.get('/indexAllDocs', async function (req, res) {
    
   
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
            
                assetProps = {},
                assetProps.id   =  algoSeasListing.assetInformation.nName.split("#")[1],  
                assetProps.nName =  algoSeasListing.assetInformation.nName,
                
                
                assetProps ={ ...assetProps, ...algoSeasListing.assetInformation.nProps.properties},
                
                //add additional key fields to be indexed to es.
                assetProps.listedAlgoAmount = algoSeasListing.marketActivity.listedAlgoAmount, //price and listedAlgoAmount are same...
                assetProps.price = algoSeasListing.assetInformation.listing.price,
                
                //http://localhost:9200/index/id  returns the asset properties/data where index is the collectionName and id is asset/pirate Id
                esIndex =  algoSeasListing.assetInformation.nName.split("#")[0].replace(/ /g,'').toLowerCase(), //es allows index names without spaces and lowercase only 
                
                
                //convert booleans to string as elasticsearch schema fails to understand  {"Shirts": "Flow"}, if {"Shirts": false} is already added for other document(asset)
                assetProps = JSON.parse(JSON.stringify(assetProps, replacer)),

                // console.log(assetProps),

                await client.index({ 
                    index: esIndex, //generic for any collection...
                    id:  assetProps.id,
                    body: assetProps
                }), (err, resp, status) => {
                    console.log(resp);

                }
                                
                ));

            console.log('All Listings Assets Have Been Indexed!');
            
            // res.json('All Listings Assets Have Been Indexed!');
            
            console.log( '\n\n\n\n\n', '...........Preparing For The Next Data Check In ' + intervalDuration/1000 + ' secs........... ');
            
            // res.json(algoSeasListings)            
            
        } catch (err) {
            console.log(err)
        };
        
    }
    
    //fetch and index data for the first time. 
    pingElasticsearch()
    indexAllDocs()


    //setInterval used to ingest data automatically in near real-time! //interval can be set to as low as 1min
    // this ensures that gaming NFTs properties to be in sync with elasticsearch NFTs.
            
    // in the future future this fetchData and Index action should be incrementally updating only the assets whose metadata have changed/updated since the last run 
    setInterval(() => {
        pingElasticsearch()
        indexAllDocs()
    }, intervalDuration); 

});
 
module.exports = router;