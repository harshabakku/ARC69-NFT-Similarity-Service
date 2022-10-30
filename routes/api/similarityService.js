/**
 * @author harsha bakku
 * @since 0.1
 * @version 0.1
 */
require('log-timestamp');
const express = require('express');
const router = express.Router();
const { indexFullCollection } = require('../../src/common/collection');
const { getSimilarNFTs } = require('../../src/common/esSimilarity');
const config = require('../../config');



router.get('/indexFullCollection', async function (req, res) {
    
    //fetch and index data for the first time. //takes less than 2 min 
    
    const collectionName = req.query.collectionName;    
    
    console.log('Getting Data From AlgoSeas Full Collection API for collection: '+ collectionName);
    await indexFullCollection(collectionName);

    
    res.json({ message: "Full Collection: All Assets,  Listings and Sales Have Been Indexed for collection: "+ collectionName,
               indexStats: config.elasticSearchServerURL + "_cat/indices?v=true",
               index: config.elasticSearchServerURL+ collectionName.replace(/ /g,'').toLowerCase() + "/_search?pretty=true&q=*:*&size=100"  
            });
             

});

router.get('/similarNFTs', async function (req, res) {
        
    const explainScoring = req.query.explainScoring;
    const limit = req.query.limit;
    const collectionName = req.query.collectionName;
    const assetId = req.query.assetId;    
    const result = await getSimilarNFTs(collectionName,assetId,explainScoring, limit);     
    res.json(result);
});
 
module.exports = router;