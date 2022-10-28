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
                "functions" : functionScoreQueries
                    
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

similarNFTs = async (collectionName, assetId, explainScoring, limit) => {

    try {
                    
        const givenNFTData = await client.get({
            index: collectionName.replace(/ /g,'').toLowerCase(),  
            id: assetId
          })


        console.log(' Generating elastisearch queries to return similar NFTs for collectionName: ' + collectionName + " and assetI: "+ assetId + '\n')  
        
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
        const functionScoreQueries = []
        metadataLongFields.forEach(function(property) {
                functionScoreQueries.push({ "linear" :{
                                                        [property] :  {
                                                            origin: givenNFTData._source[property],
                                                            scale: 1,
                                                            decay: 0.99
                                                         }
                                                      } 
                                          }); 
            });

        
        console.log(' Getting Similar listings NFTs from es query results \n')
        const listingsResult = await buildExecuteQuery(givenNFTData, propertyQueries, functionScoreQueries, "listingDate", limit, explainScoring)
        
        console.log(' Getting Similar Sales NFTs from es query results \n')
        const salesResult = await buildExecuteQuery(givenNFTData, propertyQueries, functionScoreQueries, "saleDate", limit, explainScoring)
        
      
                    
        const finalResult = {  givenNFT : givenNFTData._source,
                    similarListingNFTs : listingsResult,  //descending with similarity score 
                    similarSaleNFTs : salesResult
                }
        return finalResult;                            
        
    } catch (err) {
        console.log(err);
        return err;
    };
    
}



router.get('/similarNFTs', async function (req, res) {
        
    const explainScoring = req.query.explainScoring;
    const limit = req.query.limit;
    const collectionName = req.query.collectionName;
    const assetId = req.query.assetId;    
    const result = await similarNFTs(collectionName,assetId,explainScoring, limit);     
    res.json(result);
});
 
module.exports = router;