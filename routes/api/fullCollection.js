require('log-timestamp');
const express = require('express');
const router = express.Router();
const axios = require('axios')
const client = require('../../elasticsearch/connection');
require('events').EventEmitter.defaultMaxListeners = 0; //several async functions running in parallel while indexing assets to elasticsearch. //bulkIndex, batchProcessIndexing to elasticsearch is another solution. 

const fullCollectionURL = `https://d3ohz23ah7.execute-api.us-west-2.amazonaws.com/prod/marketplace/v2/assetsByCollection/AlgoSeas%20Pirates?type=collection&sortAscending=true&limit=5000`;
// let nextToken = 'eyJQSyI6Ik5GVCIsIlNLIjoiODc0NjAyNTE3IiwiY29sTmFtZSI6IkFsZ29TZWFzIFBpcmF0ZXMiLCJuUmFuayI6MjAwMDB9';
let nextToken = null
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
            
            
            let dataURL = fullCollectionURL;            
            if(nextToken!=null){
                dataURL = fullCollectionURL+ "&nextToken=" + nextToken
            }

            console.log(dataURL);
            const result = await axios.post(`${dataURL}`,{},{
                headers: {
                    "Content-Type": "application/json"
                }                                
            });

            console.log('Data Received!')

            const algoSeasAssets = result.data.assets;
            nextToken = result.data.nextToken;

            
            console.log("no. of assets fetched " + algoSeasAssets.length)
            
            console.log('Indexing fetched assets/NFTs on elasticsearch ...')
            
            // console.log(algoSeasAssets);

            algoSeasAssets.length && algoSeasAssets.map(async asset => (
            
                assetProps = {},
                assetProps.id   =  asset.assetInformation.nName.split("#")[1],  
                assetProps.nName =  asset.assetInformation.nName,
                
                // console.log(asset),
                // properties does not exist for about 23 NFTs, eg: 20698, 20867, 20661, 20372                 
                assetProps = { ...assetProps, ...asset.assetInformation.nProps?.properties},
                
                //add additional key fields to be indexed to es.
                asset.marketActivity && asset.marketActivity.listedAlgoAmount ? assetProps.listedAlgoAmount = asset.marketActivity.listedAlgoAmount : void(0), 

                asset.assetInformation.listing ? assetProps.listingDate = asset.assetInformation.listing.date :void(0),
                asset.assetInformation.listing ? assetProps.listingPrice = asset.assetInformation.listing.price :void(0),

                
                //http://localhost:9200/index/_doc/id  returns the asset properties/data where index is the collectionName and id is asset/pirate Id
                esIndex =  asset.assetInformation.nName.split("#")[0].replace(/ /g,'').toLowerCase(), //es allows index names without spaces and lowercase only 
                
                
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
            
            console.log("no. of assets indexed " + algoSeasAssets.length+ "\n\n\n");

            if (nextToken) {
                console.log("fetching data again using nextToken "+ nextToken )
                indexAllDocs();
            } else {                    
                nextToken = null;
                console.log('All Assets (Full Collection) Have Been Indexed!');                    
                console.log( '\n\n\n\n\n', '...........Preparing For The Next Data Check In ' + intervalDuration/1000 + ' secs........... ');
            };

            
            
            
            // res.json(algoSeasAssets)            
            
        } catch (err) {
            console.log(err)
        };
        
    }
    
    //fetch and index data for the first time. 
    pingElasticsearch()
    console.log('Getting Data From AlgoSeas Full Collection API');
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