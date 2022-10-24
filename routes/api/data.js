require('log-timestamp');
const express = require('express');
const router = express.Router();
const axios = require('axios')
const client = require('../../elasticsearch/connection');

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
            
            res.json('All Data Has Been Indexed!')


            
        } catch (err) {
            console.log(err)
        };

        console.log('Preparing For The Next Data Check...');
    }

    pingElasticsearch()
    indexAllDocs()
});
 
module.exports = router;