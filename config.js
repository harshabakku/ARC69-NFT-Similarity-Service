/**
 * Basic configurations of the server
 * @author harsha bakku
 * @since 0.1
 * @version 0.1
 */

const dotenv = require('dotenv');
dotenv.config();

(function() {
    // export configuration parameters
    module.exports = {

   
        fullCollectionURLPrefix : 'https://d3ohz23ah7.execute-api.us-west-2.amazonaws.com/prod/marketplace/v2/assetsByCollection/', 

        collectionSalesURLPrefix : 'https://d3ohz23ah7.execute-api.us-west-2.amazonaws.com/prod/marketplace/sales',
        
        dataFetchInterval : 3600000,  //dataFetchandIndexInterval duration in milli secs, change it to 60 secs before go live.
 
        collectionName : 'AlgoSeas Pirates',

        metadataFields : //[ "Back Hand",  "Back Item",  "Background",  "Background Accent",  "Body",  "Face",  "Facial Hair",  "Footwear",  "Front Hand",  "Hat",  "Head",  "Hip Item",  "Left Arm",  "Necklace",  "Overcoat",  "Pants",  "Pet",  "Right Arm",  "Scenery",  "Shirt",  "Shirts",  "Tattoo",  
        ["combat", "constitution", "luck", "plunder"],

        metadataLongFields : ["combat", "constitution", "luck", "plunder"]                   

                    
    }
})();
