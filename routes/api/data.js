require('log-timestamp');
const express = require('express');
const router = express.Router();
const axios = require('axios')
const client = require('../../elasticsearch/connection');

const AlgoSeasListingsURL = `https://d3ohz23ah7.execute-api.us-west-2.amazonaws.com/prod/marketplace/v2/assetsByCollection/AlgoSeas%20Pirates?type=listing&sortBy=price&sortAscending=true&limit=500`;


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

            const algoSeaslistings = await axios.post(`${AlgoSeasListingsURL}`,{},{
                headers: {
                    "Content-Type": "application/json"
                }                                
            });

            console.log('Data Received!')

            results = algoSeaslistings.data

            // test indexing
            await client.index({
                index: 'game-of-thrones',
                document: {
                  character: 'Ned Stark',
                  quote: 'Winter is coming.'
                }
              })
            console.log('Indexing Data...')

            console.log('All Data Has Been Indexed!');
            
            res.json(results)

            // res.json('All Data Has Been Indexed!')


            
        } catch (err) {
            console.log(err)
        };

        console.log('Preparing For The Next Data Check...');
    }

    pingElasticsearch()
    indexAllDocs()
});
 
module.exports = router;