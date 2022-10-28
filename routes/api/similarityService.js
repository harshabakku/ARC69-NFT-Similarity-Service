/**
 * @author harsha bakku
 * @since 0.1
 * @version 0.1
 */
require('log-timestamp');
const express = require('express');
const router = express.Router();
const client = require('../../elasticsearch/connection');
const config = require("../../config.js");


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

    buildExecuteQuery = async (givenNFT, propertyQueries, functionScoreQueries, existsField, limit, explain) => {

        const query = {     
            "explain": explain,           
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
                index: givenNFT._index,     
                body: query
            })

        console.log(result);

        //remove the givenNFT from the elasticsearch result hits             
        const similarNFTs = result.hits.hits.filter(function (similarNFT) {     
            return similarNFT._id != givenNFT._id
        });    
        
        return similarNFTs
    
    }

    similarNFTs = async () => {

        try {
                        
            const givenNFTData = await client.get({
                index: config.collectionName.replace(/ /g,'').toLowerCase(),  
                id: '20393' //get from query param
              })


            console.log(' Generating elastisearch queries to return similar NFTs \n')  
            
            const metadataFields = config.metadataFields;
            const metadataLongFields = config.metadataLongFields;                   


            //build should query (OR query) to match various asset props here.
            //elasticsearch computes the similarity score accordingly depending on the no. of matches . https://www.elastic.co/guide/en/elasticsearch/reference/current/similarity.html
            const propertyQueries = [];
            metadataFields.forEach(function(property) {
                    propertyQueries.push({ "match": { [property] :  givenNFTData._source[property] }});                
                });


            //https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-function-score-query.html#function-decay   
            //https://stackoverflow.com/questions/58046769/elasticsearch-find-closest-number-when-scoring-results?rq=1
            
            //The scale field tells elastic how to decay the score with matching number's distance from origin(property value)
            const functionScoreQueries = {}
            metadataLongFields.forEach(function(property) {
                    functionScoreQueries[property] =  {
                                                                origin: givenNFTData._source[property],
                                                                scale: 1,
                                                                decay: 0.99
                                                             }; 
                });

            console.log(functionScoreQueries);

            
            console.log(' Getting Similar listings NFTs from es query results \n')
            const listingsResult = await buildExecuteQuery(givenNFTData, propertyQueries, functionScoreQueries, "listingDate", 50, false)
            
            console.log(' Getting Similar Sales NFTs from es query results \n')
            const salesResult = await buildExecuteQuery(givenNFTData, propertyQueries, functionScoreQueries, "saleDate", 50, false)
            
          
                        
            res.json({  givenNFT : givenNFTData._source,
                        similarListingNFTs : listingsResult,  //descending with similarity score 
                        similarSaleNFTs : salesResult
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