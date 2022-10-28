/**
 * @author harsha bakku
 * @since 0.1
 * @version 0.1
 */
require('log-timestamp');
const express = require('express');
const router = express.Router();
 const axios = require('axios')
const config = require("../../config.js");
const client = require('../../elasticsearch/connection');

require('events').EventEmitter.defaultMaxListeners = 0; //several async functions running in parallel while indexing assets to elasticsearch. //bulkIndex, batchProcessIndexing to elasticsearch is another solution. 

// let nextToken = 'eyJQSyI6Ik5GVCIsIlNLIjoiODc0NjAyNTE3IiwiY29sTmFtZSI6IkFsZ29TZWFzIFBpcmF0ZXMiLCJuUmFuayI6MjAwMDB9';
let nextToken = null

const intervalDuration =  config.dataFetchInterval;  

//convert booleans to string as elasticsearch schema fails to understand  {"Shirts": "Flow"}, if {"Shirts": false} is already added for other document(asset)
function replacer(key, value) {
    if (typeof value === "boolean") {
      return String(value);
    }
    return value;
  }


// ====== Get Data From AlgoSeas Full Collection API (or Web3 in the future) and then index onto Elasticsearch
// indexes listing data as well
async function indexFullCollection (collectionName) { 
    try {

        let dataURL = config.fullCollectionURLPrefix + encodeURI(collectionName) + `?type=collection&sortAscending=true&limit=5000`;            
        if(nextToken!=null){
            dataURL = dataURL+ "&nextToken=" + nextToken
        }

        console.log(dataURL);
        const result = await axios.post(`${dataURL}`,{},{
            headers: {
                "Content-Type": "application/json"
            }                                
        });

        const algoSeasAssets = result.data.assets;
        nextToken = result.data.nextToken;

        console.log("Indexing fetched assets/NFTs to elasticsearch: "  + algoSeasAssets.length )
        
        // console.log(algoSeasAssets);

        algoSeasAssets.length && algoSeasAssets.map(async asset => (
        
            assetProps = {},
            assetProps.id   =  asset.assetInformation.nName.split("#")[1],  
            assetProps.nName =  asset.assetInformation.nName,
            
            // console.log(asset),
            // properties does not exist for about 23 NFTs, eg: 20698, 20867, 20661, 20372                 
            assetProps = { ...assetProps, ...asset.assetInformation.nProps?.properties},
            
            //add additional key fields to be indexed to es.
            asset.assetInformation.listing ? assetProps.listingDate = asset.assetInformation.listing.date :void(0),
            asset.assetInformation.listing ? assetProps.listingPrice = asset.assetInformation.listing.price :void(0),

            
            //http://localhost:9200/index/_doc/id  returns the asset properties/data where index is the collectionName and id is asset/pirate Id
            esIndex =  collectionName.replace(/ /g,'').toLowerCase(), //es allows index names without spaces and lowercase only 
            
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
            console.log("fetching data again using nextToken ")
            indexFullCollection(collectionName);

        } else {                    
            nextToken = null;

            console.log('All Assets (Full Collection) Have Been Indexed!\n\n\n');     
            
            const collectionSalesURL = config.collectionSalesURLPrefix + '?collectionName=' + encodeURI(collectionName) +  '&sortBy=time&sortAscending=false&limit=5000'
            console.log('Fetching Sales Data now....'+ collectionSalesURL)
            
            

            const result = await axios.get(`${collectionSalesURL}`,{
                headers: {
                    "Content-Type": "application/json"
                }                                
            });

            const algoSeasAssetSales = result.data.reverse(); //reversed here so that latest sale overwrites older one if any
            
            console.log("no. of asset Sales fetched " + algoSeasAssetSales.length)
                                    
            //for loop is being used here as there are  NFT secondary sales ..,  
            for (let i=0; i < algoSeasAssetSales.length; i++) {
                let asset = algoSeasAssetSales[i];
                
                assetId   =  asset.assetInformation.nName.split("#")[1],  
                esIndex =   collectionName.replace(/ /g,'').toLowerCase(),  
                                        
                await client.update({ 
                    index: esIndex, 
                    id:  assetId,
                    body: {doc : {saleAlgoAmount : asset.marketActivity.algoAmount , saleDate : asset.marketActivity.creationDate, saleTxnID : asset.marketActivity.txnID, saleGroupTxnID : asset.marketActivity.groupTxnID, }}   //updated data has to be sent in doc field here
                }), (err, resp, status) => {
                    console.log(resp);
                }            
                
            }
            
            console.log('Full Sales Data Indexing/Updating Complete:  ' +  algoSeasAssetSales.length + ' assets \n\n\n\n\n');      
            console.log('...........Preparing For The Next Data Check In ' + intervalDuration/1000 + ' secs........... ');
           
        };
                   
        
    } catch (err) {
        console.log(err)
    };
    
}


    

router.get('/indexFullCollection', async function (req, res) {
    
    //fetch and index data for the first time. //takes less than 2 min 
    console.log('Getting Data From AlgoSeas Full Collection API');
    
    const collectionName = config.collectionName;
    await indexFullCollection(collectionName);
        

    // setInterval used to ingest data automatically in near real-time! //interval can be set to as low as 1min
    // this ensures that gaming NFTs properties to be in sync with elasticsearch NFTs.
            
    // in the future(if indexing takes longer than 15 min) fetchData and Index action should be incrementally updating only the assets whose metadata have changed/updated since the last run 
    setInterval(async () => {
        await indexFullCollection(collectionName);
    }, intervalDuration); 

});
 
module.exports = router;