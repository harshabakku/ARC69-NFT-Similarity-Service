require('log-timestamp');
const express = require('express');
const router = express.Router();
const client = require('../../elasticsearch/connection');



router.get('/similarNFTs', async function (req, res) {
    
   
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

    buildExecuteQuery = async (esIndex, propertyQueries, functionScoreQueries, existsField, limit) => {

        const query = {                
            "size" : limit, //we can control the no. of results from es with size here... 
            "query": {
                "function_score": {
                    "query": {
                        "bool": { 
                            "should": propertyQueries,
                            "filter": [
                                {    
                                    "exists": {
                                    "field": existsField  //returns only listing or soldNFT
                                    }
                                }
                            ]
                        }
                    },
                    "functions" : [
                        {  //can be 'exp' for exponential or 'linear' 
                        "linear": functionScoreQueries
                        }
                    ]
                        
                }
            }
        }

        console.log(JSON.stringify(query));

        const result = await client.search({
                index: esIndex,     
                body: query
            })

        
        return result
    
    }

    similarNFTs = async () => {

        try {
                        
            const givenNFTData = await client.get({
                index: 'algoseaspirate', //replace with indexName/CollectionName 
                id: '20393'
              })


            console.log(' Generating elastisearch queries to return similar NFTs \n')  
            
         
            //bring this into .env /constants file later on
            //can also be autogenerated from http://172.18.0.2:9200/algoseaspirate/_mapping    http://eshost/index/mapping basically
            const metadataFields = //[ "Back Hand",  "Back Item",  "Background",  "Background Accent",  "Body",  "Face",  "Facial Hair",  "Footwear",  "Front Hand",  "Hat",  "Head",  "Hip Item",  "Left Arm",  "Necklace",  "Overcoat",  "Pants",  "Pet",  "Right Arm",  "Scenery",  "Shirt",  "Shirts",  "Tattoo",  
                              ["combat", "constitution", "luck", "plunder"];

            const metadataLongFields = ["combat", "constitution", "luck", "plunder"];                   


            //build should query (OR query) to match various asset props here.
            //elasticsearch computes the similarity score accordingly depending on the no. of matches . https://www.elastic.co/guide/en/elasticsearch/reference/current/similarity.html
            const propertyQueries = [];
            metadataFields.forEach(function(property) {
                    propertyQueries.push({ "match": { [property] :  givenNFTData._source[property] }});                
                });


            //https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-function-score-query.html#function-decay   
            //https://stackoverflow.com/questions/37005785/how-to-find-the-nearest-closest-number-using-query-dsl-in-elasticsearch    
            //https://stackoverflow.com/questions/58046769/elasticsearch-find-closest-number-when-scoring-results?rq=1
            const functionScoreQueries = {}
            metadataLongFields.forEach(function(property) {
                    functionScoreQueries[property] =  {
                                                                origin: givenNFTData._source[property],
                                                                scale: 1,
                                                                decay: 0.999
                                                             }; 
                });

            console.log(functionScoreQueries);

            
            console.log(' Getting Similar listings NFTs from es query results \n')
            const listingsResult = await buildExecuteQuery(givenNFTData._index, propertyQueries, functionScoreQueries, "listingDate", 50)
            console.log(listingsResult);
            
            console.log(' Getting Similar Sales NFTs from es query results \n')
            const salesResult = await buildExecuteQuery(givenNFTData._index, propertyQueries, functionScoreQueries, "saleDate", 50)
            console.log(salesResult);
            
            
                                    
            //remove the givenNFT from the elasticsearch result hits 
            let similarListingNFTs = listingsResult.hits.hits;
            similarListingNFTs.shift();

            
            
            res.json({  givenNFT : givenNFTData._source,
                        similarListingNFTs : similarListingNFTs,  //descending with similarity score 
                        similarSaleNFTs : salesResult.hits.hits
                    });            
            
        } catch (err) {
            console.log(err)
            res.json(err)
        };
        
    }
    
    pingElasticsearch()
    similarNFTs()     

});
 
module.exports = router;